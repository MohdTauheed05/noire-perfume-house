import { adminPage } from "@/lib/admin"; import { adjustStock } from "../../actions"; import { fetchProducts, fetchRecentMovements } from "@/lib/store";
export default async function Inventory({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  await adminPage(); const { filter } = await searchParams;
  const rows = (await fetchProducts()).flatMap((p) => p.variants.map((v) => ({ v, name: p.name, brand: p.brandName })))
    .filter(({ v }) => (filter === "out" ? v.stock === 0 : filter === "low" ? v.stock <= 5 : true)).sort((a, b) => a.v.stock - b.v.stock).slice(0, 150);
  const moves = await fetchRecentMovements(10);
  return (<div className="space-y-6"><h1 className="h-display text-3xl text-champagne">Inventory</h1><nav className="flex gap-4 text-xs uppercase tracking-widest"><a href="?">All</a><a href="?filter=low">Low (≤5)</a><a href="?filter=out">Out of stock</a></nav>
    <ul className="card divide-y divide-white/10">{rows.map(({ v, name, brand }) => <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"><span>{brand} {name} {v.sizeMl}ml · <b className={v.stock === 0 ? "text-red-400" : v.stock <= 5 ? "text-gold" : ""}>{v.stock}</b></span>
      <form action={adjustStock} className="flex gap-1"><input type="hidden" name="variantId" value={v.id} /><input name="delta" type="number" aria-label="Change (+/-)" placeholder="+/-" className="input !w-20 !py-1" required /><input name="reason" aria-label="Reason" placeholder="Reason" className="input !w-36 !py-1" /><button className="btn-ghost !px-3 !py-1">Apply</button></form></li>)}</ul>
    <section><h2 className="label">Recent stock movements</h2><ul className="text-xs text-white/50">{moves.map((m) => <li key={m.id}>{m.delta > 0 ? "+" : ""}{m.delta} · {m.reason}</li>)}</ul></section></div>);
}
