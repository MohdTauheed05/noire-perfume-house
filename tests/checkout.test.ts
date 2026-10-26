import { describe, it, expect } from "vitest";
import { CheckoutError, mergeCart, planOrder } from "@/lib/checkout";
import type { Coupon, Product } from "@/db/models";

const settings = { vatPercent: 5, shippingFlatCents: 2500, freeShippingOverCents: 30000 };
const product = (status: Product["status"] = "PUBLISHED"): Product => ({
  id: "p1", name: "P", slug: "p", brandId: "b", brandName: "T", brandSlug: "t", description: "d", audience: "MEN", family: null, concentration: "EDT", topNotes: null, heartNotes: null, baseNotes: null,
  status, seoTitle: null, createdAt: 0, categoryIds: [], images: [],
  variants: [{ id: "v1", sku: "A", sizeMl: 100, priceCents: 10000, salePriceCents: null, stock: 3 }, { id: "v2", sku: "B", sizeMl: 50, priceCents: 5000, salePriceCents: 4000, stock: 1 }] });
const ten: Coupon = { id: "TEN", code: "TEN", type: "PERCENT", value: 10, minSubtotalCents: 0, startsAt: null, expiresAt: null, usageLimit: null, used: 0, active: true };
const plan = (cart: { variantId: string; qty: number }[], opts: { status?: Product["status"]; code?: string; coupon?: Coupon | null } = {}) =>
  planOrder(mergeCart(cart), [product(opts.status)], settings, opts.code, opts.coupon ?? null);

describe("order planning (server-side pricing & stock rules)", () => {
  it("uses the stored sale price, never client input", () => {
    const r = plan([{ variantId: "v2", qty: 1 }]);
    expect(r.totals.subtotalCents).toBe(4000); expect(r.lines[0].unitCents).toBe(4000);
  });
  it("merges duplicate lines before checking stock", () => {
    expect(plan([{ variantId: "v1", qty: 2 }, { variantId: "v1", qty: 1 }]).lines[0].qty).toBe(3);
    expect(() => plan([{ variantId: "v1", qty: 2 }, { variantId: "v1", qty: 2 }])).toThrow(/Insufficient stock/);
  });
  it("prevents overselling", () => expect(() => plan([{ variantId: "v1", qty: 2 }, { variantId: "v2", qty: 2 }])).toThrow(/Insufficient stock/));
  it("rejects bad quantities, empty carts and unknown variants", () => {
    expect(() => plan([{ variantId: "v1", qty: 0 }])).toThrow(CheckoutError);
    expect(() => plan([{ variantId: "v1", qty: 21 }])).toThrow(CheckoutError);
    expect(() => plan([{ variantId: "v1", qty: 1.5 }])).toThrow(CheckoutError);
    expect(() => plan([])).toThrow(/empty/);
    expect(() => plan([{ variantId: "nope", qty: 1 }])).toThrow(/no longer available/);
  });
  it("refuses unpublished products", () => expect(() => plan([{ variantId: "v1", qty: 1 }], { status: "DRAFT" })).toThrow(/unavailable/));
  it("applies a coupon, rejects an unknown or expired one", () => {
    const r = plan([{ variantId: "v1", qty: 1 }], { code: "ten", coupon: ten }); expect(r.totals.discountCents).toBe(1000); expect(r.couponId).toBe("TEN");
    expect(() => plan([{ variantId: "v1", qty: 1 }], { code: "nope", coupon: null })).toThrow(/Invalid coupon/);
    expect(() => plan([{ variantId: "v1", qty: 1 }], { code: "ten", coupon: { ...ten, expiresAt: new Date(2000, 0, 1) } })).toThrow(/expired/);
    expect(() => plan([{ variantId: "v1", qty: 1 }], { code: "ten", coupon: { ...ten, usageLimit: 5, used: 5 } })).toThrow(/limit/);
  });
  it("charges flat shipping below the free-shipping threshold only", () => {
    expect(plan([{ variantId: "v2", qty: 1 }]).totals.shippingCents).toBe(2500);
    expect(plan([{ variantId: "v1", qty: 3 }]).totals.shippingCents).toBe(0);
  });
});
