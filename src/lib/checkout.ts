import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/db/firestore";
import { mapCoupon, type Coupon, type Order, type Product, type Variant } from "@/db/models";
import { computeTotals, couponDiscount, type Settings } from "./pricing";
import { auditDoc, col, movementDoc, newId, productDoc, productsByVariantIds } from "./store";

export type CartInput = { variantId: string; qty: number }[];
export class CheckoutError extends Error {}
export type Contact = { email: string; name: string; phone: string; address: string; city: string };

export const settingsFrom = (m: Record<string, string>): Settings => ({ vatPercent: Number(m.vatPercent ?? 5), shippingFlatCents: Number(m.shippingFlatCents ?? 2500), freeShippingOverCents: Number(m.freeShippingOverCents ?? 30000) });
export async function loadSettings(): Promise<Settings & { demo: boolean }> {
  const m = ((await col("settings").doc("main").get()).data() ?? {}) as Record<string, string>;
  return { ...settingsFrom(m), demo: !m.paymentProvider };
}

/** Validates quantities and merges duplicate lines. */
export function mergeCart(cart: CartInput) {
  if (!cart.length) throw new CheckoutError("Cart is empty");
  const merged = new Map<string, number>();
  for (const l of cart) {
    if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > 20) throw new CheckoutError("Invalid quantity");
    merged.set(l.variantId, (merged.get(l.variantId) ?? 0) + l.qty);
  }
  return merged;
}

export type PlannedLine = { product: Product; variant: Variant; qty: number; unitCents: number };
/**
 * Pure pricing/stock decision. Prices come ONLY from the products read on the server; client prices are never trusted.
 * Throws CheckoutError on unavailable items, insufficient stock or a bad coupon.
 */
export function planOrder(merged: Map<string, number>, products: Product[], settings: Settings, couponCode: string | undefined, coupon: Coupon | null, now = new Date()) {
  const byVariant = new Map<string, { product: Product; variant: Variant }>();
  for (const p of products) for (const v of p.variants) byVariant.set(v.id, { product: p, variant: v });
  const lines: PlannedLine[] = [];
  for (const [variantId, qty] of merged) {
    const hit = byVariant.get(variantId);
    if (!hit) throw new CheckoutError("An item is no longer available");
    if (hit.product.status !== "PUBLISHED") throw new CheckoutError(`${hit.product.name} is unavailable`);
    lines.push({ ...hit, qty, unitCents: hit.variant.salePriceCents ?? hit.variant.priceCents });
  }
  const subtotal = lines.reduce((a, l) => a + l.unitCents * l.qty, 0);
  let discountCents = 0; let couponId: string | null = null;
  if (couponCode?.trim()) {
    const r = couponDiscount(coupon, subtotal, now);
    if (r.error) throw new CheckoutError(r.error);
    discountCents = r.discountCents; couponId = coupon!.id;
  }
  for (const l of lines) if (l.variant.stock < l.qty) throw new CheckoutError(`Insufficient stock for ${l.product.name} ${l.variant.sizeMl}ml`);
  const totals = computeTotals(lines.map((l) => ({ unitCents: l.unitCents, qty: l.qty })), discountCents, settings);
  return { lines, totals, couponId };
}

/** Creates an order in ONE Firestore transaction: re-prices, checks and decrements stock, counts coupon use, logs movements. All-or-nothing. */
export async function createOrder(userId: string | null, cart: CartInput, couponCode?: string, contact?: Contact): Promise<Order> {
  const merged = mergeCart(cart);
  const db = getDb(); const now = new Date(); const orderId = newId();
  const order = await db.runTransaction(async (tx) => {
    // --- all reads first ---
    const settings = settingsFrom(((await tx.get(col("settings").doc("main"))).data() ?? {}) as Record<string, string>);
    const products = await productsByVariantIds([...merged.keys()], tx);
    let coupon: Coupon | null = null;
    const code = couponCode?.trim().toUpperCase();
    if (code && !code.includes("/")) { const d = await tx.get(col("coupons").doc(code)); coupon = d.exists ? mapCoupon(d.id, d.data()!) : null; }
    const plan = planOrder(merged, products, settings, couponCode, coupon, now);

    // --- then writes ---
    const stockByVariant = new Map(plan.lines.map((l) => [l.variant.id, l.qty]));
    for (const p of products) {
      const touched = p.variants.some((v) => stockByVariant.has(v.id)); if (!touched) continue;
      const variants = p.variants.map((v) => (stockByVariant.has(v.id) ? { ...v, stock: v.stock - stockByVariant.get(v.id)! } : v));
      tx.update(col("products").doc(p.id), productDoc({ ...p, variants }));
    }
    if (plan.couponId) tx.update(col("coupons").doc(plan.couponId), { used: FieldValue.increment(1) });
    if (userId) tx.update(col("users").doc(userId), { orderCount: FieldValue.increment(1) });
    const items = plan.lines.map((l) => ({ variantId: l.variant.id, name: `${l.product.name} ${l.variant.sizeMl}ml`, qty: l.qty, unitCents: l.unitCents }));
    const data = { userId, status: "PENDING", paymentStatus: "DEMO_UNPAID", ...plan.totals, notes: null, contactEmail: contact?.email ?? null, shippingName: contact?.name ?? null,
      shippingPhone: contact?.phone ?? null, shippingAddress: contact?.address ?? null, shippingCity: contact?.city ?? null, items, variantIds: items.map((i) => i.variantId), createdAt: now };
    tx.set(col("orders").doc(orderId), data);
    for (const l of plan.lines) tx.set(col("stockMovements").doc(), movementDoc(l.variant.id, -l.qty, `Order ${orderId}`));
    tx.set(col("auditLogs").doc(), auditDoc(userId, "ORDER_CREATED", "order", orderId));
    return { id: orderId, ...data } as unknown as Order;
  });
  return order;
}

/** Read-only price quote for the cart page (no stock is reserved). Quantities are clamped to current stock. */
export async function planOrderQuote(cart: CartInput, settingsMap: Record<string, string>, couponCode: string | undefined, coupon: Coupon | null) {
  const products = cart.length ? await productsByVariantIds([...new Set(cart.map((c) => c.variantId))]) : [];
  const byVariant = new Map<string, { product: Product; variant: Variant }>();
  for (const p of products) for (const v of p.variants) byVariant.set(v.id, { product: p, variant: v });
  const lines = cart.flatMap((c) => {
    const hit = byVariant.get(c.variantId);
    if (!hit || hit.product.status !== "PUBLISHED") return [];
    const { product: p, variant: v } = hit;
    return [{ variantId: c.variantId, qty: Math.min(c.qty, Math.max(v.stock, 0)), requested: c.qty, name: p.name, brand: p.brandName, slug: p.slug, sizeMl: v.sizeMl, unitCents: v.salePriceCents ?? v.priceCents, stock: v.stock }];
  });
  const subtotal = lines.reduce((a, l) => a + l.unitCents * l.qty, 0);
  let discount = 0; let error: string | undefined;
  if (couponCode?.trim()) { const r = couponDiscount(coupon, subtotal); discount = r.discountCents; error = r.error; }
  return { lines, totals: computeTotals(lines, discount, settingsFrom(settingsMap)), error };
}
