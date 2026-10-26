import { notFound } from "next/navigation"; import { fetchAuditFor, fetchOrder } from "@/lib/store"; import { adminPage } from "@/lib/admin"; import { aed, ORDER_FLOW } from "@/lib/pricing"; import { updateOrder } from "../../../actions";
export default async function Order({ params }: { params: Promise<{ id: string }> }) {
  await adminPage(); const { id } = await params; const o = await fetchOrder(id); if (!o) notFound();
  const items = o.items; const log = await fetchAuditFor(id);
  return (<div className="space-y-6 print:text-black"><h1 className="h-display text-3xl text-champagne">Order {o.id.slice(0, 8).toUpperCase()}</h1>
    <p className="text-sm text-white/60">{o.status} · payment {o.paymentStatus === "DEMO_UNPAID" ? "DEMO (no payment collected)" : o.paymentStatus} · {o.createdAt.toLocaleString("en-GB")}</p>
    <div className="card p-4 text-sm"><p>{o.shippingName} · {o.contactEmail} · {o.shippingPhone}</p><p>{o.shippingAddress}, {o.shippingCity}</p></div>
    <ul className="card divide-y divide-white/10">{items.map((i) => <li key={i.id} className="flex justify-between p-3 text-sm"><span>{i.qty} × {i.name}</span><span>{aed(i.unitCents * i.qty)}</span></li>)}
      <li className="flex justify-between p-3 text-sm"><span>Discount / Shipping / VAT incl.</span><span>−{aed(o.discountCents)} / {aed(o.shippingCents)} / {aed(o.taxCents)}</span></li><li className="flex justify-between p-3 font-medium"><span>Total</span><span>{aed(o.totalCents)}</span></li></ul>
    <form action={updateOrder} className="card space-y-3 p-4"><input type="hidden" name="id" value={o.id} />
      <div><label className="label" htmlFor="status">Move to</label><select id="status" name="status" className="input max-w-xs" defaultValue=""><option value="">(no change)</option>{(ORDER_FLOW[o.status] ?? []).map((x) => <option key={x}>{x}</option>)}</select></div>
      <div><label className="label" htmlFor="notes">Internal notes</label><textarea id="notes" name="notes" rows={3} defaultValue={o.notes ?? ""} className="input" /></div><button className="btn-gold">Update</button>
      <p className="text-xs text-white/40">Cancelling restocks items. Refunds are only recorded as a status; no payment provider is connected to process money.</p></form>
    <section><h2 className="label">History</h2><ul className="text-xs text-white/50">{log.map((l) => <li key={l.id}>{l.createdAt.toLocaleString("en-GB")} — {l.action}</li>)}</ul></section></div>);
}
