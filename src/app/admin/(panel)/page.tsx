import Link from "next/link";
import { adminPage } from "@/lib/admin"; import { aed } from "@/lib/pricing";
import { col, fetchProducts, fetchRecentOrders } from "@/lib/store";
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await adminPage(); const { from, to } = await searchParams;
  const fromD = from ? new Date(from) : undefined; const toD = to ? new Date(`${to}T23:59:59`) : undefined;
  const count = async (q: { count(): { get(): Promise<{ data(): { count: number } }> } }) => (await q.count().get()).data().count;
  const [products, brands, customers, orders, all] = await Promise.all([
    count(col("products")), count(col("brands")), count(col("users").where("role", "==", "CUSTOMER")),
    fetchRecentOrders(2000, fromD && !isNaN(fromD.getTime()) ? fromD : undefined, toD && !isNaN(toD.getTime()) ? toD : undefined), fetchProducts()]);
  const pending = orders.filter((o) => o.status === "PENDING").length;
  const rev = orders.filter((o) => o.paymentStatus === "PAID").reduce((a, o) => a + o.totalCents, 0);
  const low = all.flatMap((p) => p.variants.filter((v) => v.stock <= 5).map((v) => ({ v, name: p.name }))).sort((a, b) => a.v.stock - b.v.stock).slice(0, 8);
  const recent = orders.slice(0, 6);
  const sold = new Map<string, number>(); for (const o of orders) for (const i of o.items) sold.set(i.name, (sold.get(i.name) ?? 0) + i.qty);
  const best = [...sold].map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const K = ({ l, v }: { l: string; v: string | number }) => <div className="card p-4"><p className="label">{l}</p><p className="h-display text-3xl">{v}</p></div>;
  return (<div className="space-y-8"><h1 className="h-display text-3xl text-champagne">Dashboard</h1>
    <form className="flex flex-wrap items-end gap-3"><div><label className="label" htmlFor="from">From</label><input id="from" name="from" type="date" defaultValue={from} className="input" /></div><div><label className="label" htmlFor="to">To</label><input id="to" name="to" type="date" defaultValue={to} className="input" /></div><button className="btn-ghost">Filter</button></form>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><K l="Products" v={products} /><K l="Brands" v={brands} /><K l="Orders" v={orders.length} /><K l="Pending orders" v={pending} /><K l="Paid revenue" v={aed(rev)} /><K l="Customers" v={customers} /><K l="Low-stock items" v={low.length} /></div>
    <p className="text-xs text-white/40">Demo orders are recorded as “DEMO_UNPAID” and never count as revenue.</p>
    <div className="grid gap-6 md:grid-cols-2"><section><h2 className="label">Recent orders</h2><ul className="card divide-y divide-white/10">{recent.map((o) => <li key={o.id}><Link className="flex justify-between p-3 text-sm hover:text-gold" href={`/admin/orders/${o.id}`}><span>{o.id.slice(0, 8).toUpperCase()} · {o.status}</span><span>{aed(o.totalCents)}</span></Link></li>)}{!recent.length && <li className="p-3 text-sm text-white/50">None</li>}</ul></section>
      <section><h2 className="label">Best sellers</h2><ul className="card divide-y divide-white/10">{best.map((b) => <li key={b.name} className="flex justify-between p-3 text-sm"><span>{b.name}</span><span>{b.qty}</span></li>)}{!best.length && <li className="p-3 text-sm text-white/50">No sales yet</li>}</ul></section>
      <section className="md:col-span-2"><h2 className="label">Low stock (≤ 5)</h2><ul className="card divide-y divide-white/10">{low.map((l) => <li key={l.v.id} className="flex justify-between p-3 text-sm"><span>{l.name} {l.v.sizeMl}ml</span><span className={l.v.stock === 0 ? "text-red-400" : ""}>{l.v.stock}</span></li>)}</ul></section></div></div>);
}
