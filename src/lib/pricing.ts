export type Coupon = { code: string; type: "PERCENT" | "FIXED"; value: number; minSubtotalCents: number;
  startsAt: Date | null; expiresAt: Date | null; usageLimit: number | null; used: number; active: boolean };
export type Settings = { vatPercent: number; shippingFlatCents: number; freeShippingOverCents: number };
export type Line = { unitCents: number; qty: number };

export function couponDiscount(c: Coupon | null, subtotalCents: number, now = new Date()): { discountCents: number; error?: string } {
  if (!c) return { discountCents: 0, error: "Invalid coupon" };
  if (!c.active) return { discountCents: 0, error: "Coupon is inactive" };
  if (c.startsAt && now < c.startsAt) return { discountCents: 0, error: "Coupon not yet valid" };
  if (c.expiresAt && now > c.expiresAt) return { discountCents: 0, error: "Coupon expired" };
  if (c.usageLimit !== null && c.used >= c.usageLimit) return { discountCents: 0, error: "Coupon usage limit reached" };
  if (subtotalCents < c.minSubtotalCents) return { discountCents: 0, error: "Minimum purchase not met" };
  const raw = c.type === "PERCENT" ? Math.round((subtotalCents * c.value) / 100) : c.value;
  return { discountCents: Math.min(raw, subtotalCents) };
}
/** Prices are VAT-inclusive (UAE retail convention); VAT is extracted from the discounted total, not added on top. */
export function computeTotals(lines: Line[], discountCents: number, st: Settings) {
  const subtotalCents = lines.reduce((a, l) => a + l.unitCents * l.qty, 0);
  const afterDiscount = Math.max(0, subtotalCents - discountCents);
  const shippingCents = afterDiscount === 0 || afterDiscount >= st.freeShippingOverCents ? 0 : st.shippingFlatCents;
  const totalCents = afterDiscount + shippingCents;
  const taxCents = Math.round((totalCents * st.vatPercent) / (100 + st.vatPercent));
  return { subtotalCents, discountCents, shippingCents, taxCents, totalCents };
}
export const ORDER_FLOW: Record<string, string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"], PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"], DELIVERED: ["REFUNDED"], CANCELLED: [], REFUNDED: [],
};
export const canTransition = (from: string, to: string) => ORDER_FLOW[from]?.includes(to) ?? false;
export const aed = (cents: number) => `AED ${(cents / 100).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
