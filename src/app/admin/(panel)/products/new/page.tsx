import { adminPage } from "@/lib/admin"; import { ProductForm } from "@/components/admin/ProductForm"; import { fetchBrands, fetchCategories } from "@/lib/store";
export default async function New() { await adminPage();
  const [brands, cats] = await Promise.all([fetchBrands(), fetchCategories()]);
  brands.sort((a, b) => a.name.localeCompare(b.name)); cats.sort((a, b) => a.sortOrder - b.sortOrder);
  return <div><h1 className="h-display mb-6 text-3xl text-champagne">New product</h1><ProductForm brands={brands} cats={cats} selected={[]} variants={[]} /><p className="mt-4 text-sm text-white/50">Save first, then upload images on the edit screen.</p></div>; }
