import { describe, it, expect } from "vitest";
import { computeTotals, couponDiscount, canTransition, type Coupon } from "@/lib/pricing";
import { sniffImage } from "@/lib/storage";
import { slugify } from "@/lib/slug";

const st = { vatPercent: 5, shippingFlatCents: 2500, freeShippingOverCents: 30000 };
const base: Coupon = { code: "X", type: "PERCENT", value: 10, minSubtotalCents: 0, startsAt: null, expiresAt: null, usageLimit: null, used: 0, active: true };

describe("totals", () => {
  it("adds flat shipping under threshold and extracts VAT", () => {
    const t = computeTotals([{ unitCents: 10000, qty: 2 }], 0, st);
    expect(t).toMatchObject({ subtotalCents: 20000, shippingCents: 2500, totalCents: 22500, taxCents: 1071 });
  });
  it("free shipping over threshold", () => {
    expect(computeTotals([{ unitCents: 40000, qty: 1 }], 0, st).shippingCents).toBe(0);
  });
  it("discount never exceeds subtotal", () => {
    expect(couponDiscount({ ...base, type: "FIXED", value: 999999 }, 5000).discountCents).toBe(5000);
  });
});
describe("coupons", () => {
  it("percent works", () => expect(couponDiscount(base, 20000).discountCents).toBe(2000));
  it("rejects inactive, expired, not started, exhausted, below minimum, unknown", () => {
    const now = new Date("2026-06-01");
    expect(couponDiscount({ ...base, active: false }, 100).error).toBeTruthy();
    expect(couponDiscount({ ...base, expiresAt: new Date("2026-01-01") }, 100, now).error).toBeTruthy();
    expect(couponDiscount({ ...base, startsAt: new Date("2026-07-01") }, 100, now).error).toBeTruthy();
    expect(couponDiscount({ ...base, usageLimit: 1, used: 1 }, 100).error).toBeTruthy();
    expect(couponDiscount({ ...base, minSubtotalCents: 500 }, 100).error).toBeTruthy();
    expect(couponDiscount(null, 100).error).toBeTruthy();
  });
});
describe("order workflow", () => {
  it("allows forward transitions only", () => {
    expect(canTransition("PENDING", "PROCESSING")).toBe(true);
    expect(canTransition("DELIVERED", "PENDING")).toBe(false);
    expect(canTransition("CANCELLED", "SHIPPED")).toBe(false);
  });
});
describe("uploads", () => {
  it("detects real images by magic bytes and rejects others", () => {
    expect(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
    expect(sniffImage(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImage(Buffer.from("MZ executable renamed .jpg"))).toBeNull();
  });
});
describe("slugify", () => { it("strips accents", () => expect(slugify("Lancôme Idôle")).toBe("lancome-idole")); });
