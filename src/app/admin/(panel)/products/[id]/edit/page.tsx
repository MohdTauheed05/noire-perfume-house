import { notFound } from "next/navigation";
import { adminPage } from "@/lib/admin"; import { ProductForm } from "@/components/admin/ProductForm"; import { DropZone } from "@/components/admin/DropZone";
import { ProductImage } from "@/components/ProductImage"; import { productImageAction } from "../../../../actions"; import { fetchBrands, fetchCategories, fetchProduct } from "@/lib/store";
export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  await adminPage(); const { id } = await params;
  const p = await fetchProduct(id); if (!p) notFound();
  const [brands, cats] = await Promise.all([fetchBrands(), fetchCategories()]);
  brands.sort((a, b) => a.name.localeCompare(b.name)); cats.sort((a, b) => a.sortOrder - b.sortOrder);
  const imgs = p.images;
  const btn = (imageId: string, op: string, label: string) => <form action={productImageAction}><input type="hidden" name="productId" value={id} /><input type="hidden" name="imageId" value={imageId} /><input type="hidden" name="op" value={op} /><button className="text-xs text-gold hover:underline">{label}</button></form>;
  return (<div className="space-y-10"><h1 className="h-display text-3xl text-champagne">Edit: {p.name}</h1>
    <ProductForm p={p as unknown as Record<string, string | null>} brands={brands} cats={cats} selected={p.categoryIds} variants={p.variants} />
    <section><h2 className="label">Images (first = main)</h2>
      <ul className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">{imgs.map((i, n) => (<li key={i.id} className="card p-2"><ProductImage src={i.path} alt={i.alt ?? ""} className="aspect-[4/5] w-full" />
        <p className="mt-1 text-[10px] uppercase text-white/40">{n === 0 ? "Main · " : ""}{i.isPlaceholder ? "placeholder" : "real photo"}</p><div className="flex flex-wrap gap-2">{n > 0 && btn(i.id, "main", "Make main")}{n > 0 && btn(i.id, "up", "←")}{n < imgs.length - 1 && btn(i.id, "down", "→")}{btn(i.id, "remove", "Remove")}</div></li>))}</ul>
      <div className="grid gap-3 md:grid-cols-2"><DropZone productId={id} label="Add gallery images" /><DropZone productId={id} mode="replaceMain" label="Replace main image" /></div></section></div>);
}
