import Link from "next/link"; import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth"; import { fetchOrdersForUser } from "@/lib/store"; import { aed } from "@/lib/pricing";
export const metadata = { title: "My orders", robots: { index: false } };
export default async function Orders() {
  const u = await getUser(); if (!u) redirect("/login");
  const os = await fetchOrdersForUser(u.id);
  return (<div className="mx-auto max-w-3xl px-4 py-10"><h1 className="h-display text-4xl text-champagne">Orders</h1>
    {os.length === 0 ? <p className="mt-6 text-white/60">No orders yet.</p> : <ul className="mt-6 space-y-2">{os.map((o) => <li key={o.id}><Link href={`/account/orders/${o.id}`} className="card flex justify-between p-4 hover:border-gold"><span>{o.id.slice(0, 8).toUpperCase()} · {o.createdAt.toLocaleDateString("en-GB")}</span><span>{o.status} · {aed(o.totalCents)}</span></Link></li>)}</ul>}</div>);
}
