import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchOrder } from "@/lib/store";
import { aed } from "@/lib/pricing";
export const metadata = { title: "Order confirmation", robots: { index: false } };
export default async function Confirm({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const o = await fetchOrder(orderId); if (!o) notFound();
  const items = o.items;
  return (<div className="mx-auto max-w-2xl px-4 py-14 text-center"><h1 className="h-display text-4xl text-champagne">Thank you</h1>
    <p className="mt-2 text-white/70">Order <span className="text-gold">{o.id.slice(0, 8).toUpperCase()}</span> has been received.</p>
    {o.paymentStatus === "DEMO_UNPAID" && <p className="mt-4 border border-gold/50 bg-gold/10 p-3 text-sm">Demo order — no real payment was collected.</p>}
    <ul className="card mt-8 divide-y divide-white/10 text-left">{items.map((i) => <li key={i.id} className="flex justify-between p-3 text-sm"><span>{i.qty} × {i.name}</span><span>{aed(i.unitCents * i.qty)}</span></li>)}
      <li className="flex justify-between p-3 font-medium"><span>Total</span><span>{aed(o.totalCents)}</span></li></ul>
    <Link href="/shop" className="btn-ghost mt-8">Continue shopping</Link></div>);
}
