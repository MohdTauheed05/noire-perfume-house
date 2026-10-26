import type { Brand, Category, Product } from "@/db/models";

export const PAGE_SIZE = 12;
export type Filters = { q?: string; brand?: string; category?: string; audience?: string; family?: string; conc?: string;
  size?: string; min?: string; max?: string; stock?: string; sort?: string; page?: string };

export type Card = { id: string; slug: string; name: string; concentration: string; family: string | null; brand: string; brandSlug: string;
  fromCents: number; image: string | null; alt: string; onSale: boolean; inStock: boolean; firstVariantId: string | null };

const unit = (v: { priceCents: number; salePriceCents: number | null }) => v.salePriceCents ?? v.priceCents;
export const minPrice = (p: Product) => (p.variants.length ? Math.min(...p.variants.map(unit)) : 0);

export function toCard(p: Product): Card {
  const img = p.images[0];
  return { id: p.id, slug: p.slug, name: p.name, concentration: p.concentration, family: p.family, brand: p.brandName, brandSlug: p.brandSlug,
    fromCents: minPrice(p), image: img?.path ?? null, alt: img?.alt ?? p.name, onSale: p.variants.some((v) => v.salePriceCents !== null),
    inStock: p.variants.some((v) => v.stock > 0), firstVariantId: p.variants.find((v) => v.stock > 0)?.id ?? null };
}

/** Pure, in-memory equivalent of the old SQL query. Fine for a catalog of hundreds of products. */
export function applyFilters(products: Product[], brands: Brand[], cats: Category[], f: Filters, forceCategory?: string, forceBrand?: string) {
  const live = new Map(brands.filter((b) => b.published).map((b) => [b.id, b]));
  const q = f.q?.trim().toLowerCase();
  const brandSlug = forceBrand ?? f.brand;
  const catSlug = forceCategory ?? f.category;
  const catId = catSlug ? cats.find((c) => c.slug === catSlug)?.id ?? "\0none" : null;
  const min = f.min ? Math.round(Number(f.min) * 100) : null;
  const max = f.max ? Math.round(Number(f.max) * 100) : null;
  const size = f.size ? Number(f.size) : null;
  const has = (t: string | null) => !!t && t.toLowerCase().includes(q!);

  let rows = products.filter((p) => {
    if (p.status !== "PUBLISHED" || !live.has(p.brandId)) return false;
    if (q && !(has(p.name) || has(live.get(p.brandId)!.name) || has(p.family) || has(p.topNotes))) return false;
    if (brandSlug && live.get(p.brandId)!.slug !== brandSlug) return false;
    if (f.audience && p.audience !== f.audience.toUpperCase()) return false;
    if (f.family && p.family !== f.family) return false;
    if (f.conc && p.concentration !== f.conc) return false;
    if (catId && !p.categoryIds.includes(catId)) return false;
    if (size !== null && !p.variants.some((v) => v.sizeMl === size)) return false;
    if (min !== null && !(minPrice(p) >= min)) return false;
    if (max !== null && !(minPrice(p) <= max)) return false;
    if (f.stock === "in" && !p.variants.some((v) => v.stock > 0)) return false;
    return true;
  });
  const by = f.sort === "price-asc" ? (a: Product, b: Product) => minPrice(a) - minPrice(b)
    : f.sort === "price-desc" ? (a: Product, b: Product) => minPrice(b) - minPrice(a)
    : f.sort === "name" ? (a: Product, b: Product) => a.name.localeCompare(b.name)
    : (a: Product, b: Product) => b.createdAt - a.createdAt;
  rows = rows.sort((a, b) => by(a, b) || a.id.localeCompare(b.id));
  const page = Math.max(1, Number(f.page) || 1);
  return { items: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toCard), total: rows.length, page, pages: Math.max(1, Math.ceil(rows.length / PAGE_SIZE)) };
}
