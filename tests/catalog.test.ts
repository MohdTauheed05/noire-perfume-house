import { describe, it, expect } from "vitest";
import { applyFilters } from "@/lib/catalog-filter";
import type { Brand, Category, Product } from "@/db/models";

const brand = (id: string, name: string, published = true): Brand => ({ id, name, slug: name.toLowerCase(), description: null, country: null, website: null, logoMediaId: null, featured: false, published });
const cat = (id: string, name: string): Category => ({ id, name, slug: name.toLowerCase(), description: null, parentId: null, sortOrder: 0, published: true });
const prod = (name: string, b: Brand, aud: "MEN" | "WOMEN", price: number, stock: number, status: Product["status"] = "PUBLISHED", categoryIds: string[] = [], createdAt = 0): Product => ({
  id: `id-${name}`, name, slug: name.toLowerCase(), brandId: b.id, brandName: b.name, brandSlug: b.slug, description: "d", audience: aud, family: "Woody", concentration: "EDP", topNotes: null, heartNotes: null, baseNotes: null,
  status, seoTitle: null, createdAt, categoryIds, images: [], variants: [{ id: `v-${name}`, sku: `S-${name}`, sizeMl: 100, priceCents: price, salePriceCents: null, stock }] });

const a = brand("a", "Alpha"), b = brand("b", "Beta"), hidden = brand("h", "Hidden", false);
const cats = [cat("c1", "Gifts")];
const products = [prod("Cheap", a, "MEN", 10000, 5, "PUBLISHED", ["c1"], 3), prod("Pricey", a, "WOMEN", 90000, 0, "PUBLISHED", [], 2), prod("Mid", b, "MEN", 40000, 3, "PUBLISHED", [], 1),
  prod("Draft", b, "MEN", 20000, 3, "DRAFT"), prod("Unlisted", hidden, "MEN", 20000, 3)];
const names = (f: Parameters<typeof applyFilters>[3], fc?: string, fb?: string) => applyFilters(products, [a, b, hidden], cats, f, fc, fb).items.map((i) => i.name);

describe("catalog filtering", () => {
  it("never lists drafts or products of unpublished brands", () => { const n = names({}); expect(n).not.toContain("Draft"); expect(n).not.toContain("Unlisted"); });
  it("filters by brand, audience, price, stock and category", () => {
    expect(names({ brand: "alpha" })).toHaveLength(2);
    expect(names({ audience: "women" })).toEqual(["Pricey"]);
    expect(names({ min: "200", max: "500" })).toEqual(["Mid"]);
    expect(names({ stock: "in" })).not.toContain("Pricey");
    expect(names({}, "gifts")).toEqual(["Cheap"]);
    expect(names({}, "does-not-exist")).toEqual([]);
  });
  it("sorts and searches (case-insensitive)", () => {
    expect(names({ sort: "price-asc" })).toEqual(["Cheap", "Mid", "Pricey"]);
    expect(names({ sort: "price-desc" })).toEqual(["Pricey", "Mid", "Cheap"]);
    expect(names({})).toEqual(["Cheap", "Pricey", "Mid"]); // newest first
    expect(names({ q: "PRIC" })).toEqual(["Pricey"]);
    expect(names({ q: "beta" })).toEqual(["Mid"]); // matches brand name
  });
  it("paginates", () => { const r = applyFilters(products, [a, b, hidden], cats, { page: "9" }); expect(r.items).toHaveLength(0); expect(r.pages).toBe(1); expect(r.total).toBe(3); });
  it("builds cards with the first in-stock variant and 'from' price", () => {
    const c = applyFilters(products, [a, b], cats, {}).items.find((i) => i.name === "Pricey")!;
    expect(c.inStock).toBe(false); expect(c.firstVariantId).toBeNull(); expect(c.fromCents).toBe(90000); expect(c.image).toBeNull();
  });
});
