import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth"; import { fetchOrder } from "@/lib/store"; import { aed } from "@/lib/pricing";
export const metadata = { title: "Order", robots: { index: false } };
export default async function Order({ params }: { params: Promise<{ orderId: string }> }) {
  const u = await getUser(); if (!u) redirect("/login");
  const o = await fetchOrder((await params).orderId); if (!o || o.userId !== u.id) notFound(); // owner-only
  const items = o.items;
  return (<div className="mx-auto max-w-2xl px-4 py-10"><h1 className="h-display text-3xl text-champagne">Order {o.id.slice(0, 8).toUpperCase()}</h1>
    <p className="mt-1 text-sm text-white/60">{o.status} · payment: {o.paymentStatus === "DEMO_UNPAID" ? "demo (no payment collected)" : o.paymentStatus}</p>
    <ul className="card mt-6 divide-y divide-white/10">{items.map((i) => <li key={i.id} className="flex justify-between p-3 text-sm"><span>{i.qty} × {i.name}</span><span>{aed(i.unitCents * i.qty)}</span></li>)}<li className="flex justify-between p-3 font-medium"><span>Total</span><span>{aed(o.totalCents)}</span></li></ul></div>);
}
