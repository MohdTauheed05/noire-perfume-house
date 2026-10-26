import { adminPage } from "@/lib/admin";
import { DropZone } from "@/components/admin/DropZone"; import { ProductImage } from "@/components/ProductImage"; import { deleteMedia, assignMedia } from "../../actions"; import { fetchBrands, fetchMedia, fetchProducts } from "@/lib/store";
export default async function Media({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await adminPage(); const { q } = await searchParams; const needle = q?.trim().toLowerCase();
  const [media, prods, brands] = await Promise.all([fetchMedia(), fetchProducts(), fetchBrands()]);
  const uses = (id: string) => prods.reduce((a, p) => a + p.images.filter((i) => i.mediaId === id).length, 0) + brands.filter((b) => b.logoMediaId === id).length;
  const rows = media.filter((m) => !needle || (m.alt ?? "").toLowerCase().includes(needle) || m.path.toLowerCase().includes(needle)).slice(0, 120).map((m) => ({ m, uses: uses(m.id) }));
  const options = [...prods].sort((a, b) => a.name.localeCompare(b.name));
  return (<div className="space-y-6"><h1 className="h-display text-3xl text-champagne">Media library</h1><DropZone />
    <form className="flex gap-2"><label className="sr-only" htmlFor="q">Search media</label><input id="q" name="q" defaultValue={q} placeholder="Search" className="input max-w-sm" /><button className="btn-ghost">Search</button></form>
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{rows.map(({ m, uses }) => (<li key={m.id} className="card p-2 text-xs"><ProductImage src={m.path} alt={m.alt ?? ""} className="aspect-[4/5] w-full" />
      <p className="mt-1 truncate">{m.alt}</p><p className="text-white/40">{m.isPlaceholder ? "placeholder" : "real photo"} · used {uses}×</p>
      <form action={assignMedia} className="mt-1 flex gap-1"><input type="hidden" name="mediaId" value={m.id} /><select name="productId" aria-label="Assign to product" className="input !py-1 text-xs"><option value="">Assign to…</option>{options.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="text-gold">Add</button></form>
      {uses === 0 ? <form action={deleteMedia}><input type="hidden" name="id" value={m.id} /><button className="mt-1 text-red-400">Delete</button></form> : <p className="mt-1 text-white/30">In use — cannot delete</p>}</li>))}</ul></div>);
}
