import type { MetadataRoute } from "next";
import { fetchBrands, fetchCategories, fetchProducts } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  const [ps, bs, cs] = await Promise.all([fetchProducts(), fetchBrands(), fetchCategories()]);
  return [...["", "/shop", "/brands", "/about", "/contact", "/shipping-returns"].map((p) => ({ url: base + p })),
    ...ps.filter((p) => p.status === "PUBLISHED").map((p) => ({ url: `${base}/product/${p.slug}` })), ...bs.filter((b) => b.published).map((b) => ({ url: `${base}/brands/${b.slug}` })), ...cs.filter((c) => c.published).map((c) => ({ url: `${base}/categories/${c.slug}` }))];
}
