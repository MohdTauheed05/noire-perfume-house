import { fetchCoupons } from "@/lib/store"; import { adminPage } from "@/lib/admin"; import { AForm, Field } from "@/components/admin/Form"; import { saveCoupon, deleteCoupon } from "../../actions";
const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
export default async function Coupons() {
  await adminPage(); const cs = await fetchCoupons();
  const form = (c?: typeof cs[number]) => (<AForm action={saveCoupon} className="grid gap-3 md:grid-cols-4" submit={c ? "Save" : "Create coupon"}>{c && <input type="hidden" name="id" value={c.id} />}
    <Field n="code" l="Code" v={c?.code} req /><div><label className="label" htmlFor={`t${c?.id}`}>Type</label><select id={`t${c?.id}`} name="type" defaultValue={c?.type ?? "PERCENT"} className="input"><option value="PERCENT">Percent</option><option value="FIXED">Fixed (AED)</option></select></div>
    <Field n="value" l="Value (% or AED)" t="number" step="0.01" v={c ? (c.type === "PERCENT" ? c.value : c.value / 100) : ""} req /><Field n="min" l="Min purchase (AED)" t="number" step="0.01" v={c ? c.minSubtotalCents / 100 : 0} />
    <Field n="startsAt" l="Starts" t="date" v={day(c?.startsAt ?? null)} /><Field n="expiresAt" l="Expires" t="date" v={day(c?.expiresAt ?? null)} /><Field n="usageLimit" l="Usage limit" t="number" v={c?.usageLimit} />
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={c ? c.active : true} />Active</label></AForm>);
  return (<div className="space-y-6"><h1 className="h-display text-3xl text-champagne">Coupons</h1><details className="card p-4"><summary className="cursor-pointer text-gold">New coupon</summary><div className="mt-4">{form()}</div></details>
    {cs.map((c) => <details key={c.id} className="card p-4"><summary className="cursor-pointer">{c.code} · {c.type === "PERCENT" ? `${c.value}%` : `AED ${c.value / 100}`} · used {c.used}{!c.active && " · inactive"}</summary><div className="mt-4 space-y-3">{form(c)}<form action={deleteCoupon}><input type="hidden" name="id" value={c.id} /><button className="text-xs text-red-400">Delete</button></form></div></details>)}
    <p className="text-xs text-white/40">Product/category-specific coupon restrictions are not implemented yet.</p></div>);
}
