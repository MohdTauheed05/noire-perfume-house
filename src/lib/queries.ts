import "server-only";
import { unstable_cache } from "next/cache";
import type { Brand, Category, HomepageSection, Product } from "@/db/models";
import { applyFilters, toCard, type Card, type Filters } from "./catalog-filter";
import { fetchBrands, fetchCategories, fetchProducts, fetchSections, fetchSettings } from "./store";

export { PAGE_SIZE } from "./catalog-filter";
export type { Card, Filters };

/** Everything public reads goes through these cached loaders so a page view does not cost one Firestore read per product.
 *  Admin saves and new orders call revalidateTag(CATALOG_TAG); the 5-minute TTL is only a safety net. */
export const CATALOG_TAG = "catalog";
const cached = <T,>(key: string, fn: () => Promise<T>) => unstable_cache(fn, [`noire-${key}`], { tags: [CATALOG_TAG], revalidate: 300 });

const loadBrands = cached<Brand[]>("brands", fetchBrands);
const loadCategories = cached<Category[]>("categories", fetchCategories);
const loadProducts = cached<Product[]>("products", fetchProducts);
const loadSettings = cached<Record<string, string>>("settings", fetchSettings);
const loadSections = cached<HomepageSection[]>("sections", fetchSections);

export const getSettings = () => loadSettings();
export const homepage = () => loadSections();
export const publishedBrands = async () => (await loadBrands()).filter((b) => b.published).sort((a, b) => a.name.localeCompare(b.name));
export const featuredBrands = async () => (await publishedBrands()).filter((b) => b.featured);
export const getBrandBySlug = async (slug: string) => (await publishedBrands()).find((b) => b.slug === slug) ?? null;
export const publishedCategories = async () => (await loadCategories()).filter((c) => c.published).sort((a, b) => a.sortOrder - b.sortOrder);
export const getCategoryBySlug = async (slug: string) => (await publishedCategories()).find((c) => c.slug === slug) ?? null;

export async function listProducts(f: Filters, forceCategory?: string, forceBrand?: string) {
  const [products, brands, cats] = await Promise.all([loadProducts(), loadBrands(), loadCategories()]);
  return applyFilters(products, brands, cats, f, forceCategory, forceBrand);
}

export async function getProduct(slug: string) {
  const [products, brands] = await Promise.all([loadProducts(), loadBrands()]);
  const p = products.find((x) => x.slug === slug);
  if (!p || p.status !== "PUBLISHED") return null;
  const brand = brands.find((b) => b.id === p.brandId);
  if (!brand) return null;
  const related = (await listProducts({}, undefined, brand.slug)).items.filter((x) => x.id !== p.id).slice(0, 4);
  return { ...p, brand, images: p.images.map((i) => ({ path: i.path, alt: i.alt })), related };
}

export async function facets() {
  const [products, brands, cats] = await Promise.all([loadProducts(), publishedBrands(), publishedCategories()]);
  return {
    brands, categories: cats,
    families: [...new Set(products.map((p) => p.family).filter((x): x is string => !!x))].sort(),
    concs: [...new Set(products.map((p) => p.concentration))].sort(),
  };
}

export async function listBySlugs(slugs: string[]) {
  if (!slugs.length) return [];
  const [products, brands] = await Promise.all([loadProducts(), loadBrands()]);
  const published = new Set(brands.filter((b) => b.published).map((b) => b.id));
  return products.filter((p) => p.status === "PUBLISHED" && slugs.includes(p.slug) && published.has(p.brandId)).map(toCard);
}
