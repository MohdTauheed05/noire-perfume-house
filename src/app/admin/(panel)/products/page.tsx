import Link from "next/link";
import { adminPage } from "@/lib/admin"; import { fetchProducts } from "@/lib/store"; import { setProductStatus, deleteProduct } from "../../actions";
export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await adminPage(); const { q } = await searchParams; const needle = q?.trim().toLowerCase();
  const rows = (await fetchProducts()).filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.brandName.toLowerCase().includes(needle)).sort((a, b) => b.createdAt - a.createdAt).slice(0, 200);
  return (<div><div className="flex items-center justify-between"><h1 className="h-display text-3xl text-champagne">Products</h1><Link href="/admin/products/new" className="btn-gold">New product</Link></div>
    <form className="mt-4 flex gap-2"><label className="sr-only" htmlFor="q">Search</label><input id="q" name="q" defaultValue={q} placeholder="Search products or brands" className="input max-w-sm" /><button className="btn-ghost">Search</button></form>
    <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-white/50"><tr><th className="p-2">Name</th><th>Brand</th><th>Status</th><th></th></tr></thead><tbody>
      {rows.map((p) => (<tr key={p.id} className="border-t border-white/10"><td className="p-2"><Link className="hover:text-gold" href={`/admin/products/${p.id}/edit`}>{p.name}</Link></td><td>{p.brandName}</td><td>{p.status}</td>
        <td className="flex gap-2 p-2"><form action={setProductStatus}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value={p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} /><button className="text-xs text-gold">{p.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button></form>
          <form action={setProductStatus}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="ARCHIVED" /><button className="text-xs text-white/50">Archive</button></form>
          <form action={deleteProduct}><input type="hidden" name="id" value={p.id} /><button className="text-xs text-red-400">Delete</button></form></td></tr>))}</tbody></table></div></div>);
}
