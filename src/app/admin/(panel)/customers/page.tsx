import { adminPage } from "@/lib/admin"; import { toggleCustomer } from "../../actions"; import { col } from "@/lib/store"; import { mapUser } from "@/db/models";
export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await adminPage(); const { q } = await searchParams; const needle = q?.trim().toLowerCase();
  const rows = (await col("users").where("role", "==", "CUSTOMER").get()).docs.map((d) => mapUser(d.id, d.data()))
    .filter((u) => !needle || u.email.toLowerCase().includes(needle) || (u.name ?? "").toLowerCase().includes(needle)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 200);
  return (<div><h1 className="h-display text-3xl text-champagne">Customers</h1><form className="my-4 flex gap-2"><input name="q" defaultValue={q} aria-label="Search" placeholder="Email or name" className="input max-w-xs" /><button className="btn-ghost">Search</button></form>
    <ul className="card divide-y divide-white/10">{rows.map((u) => <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"><span>{u.name ?? "—"} · {u.email} · {u.orderCount} orders</span>
      <form action={toggleCustomer}><input type="hidden" name="id" value={u.id} /><button className="text-xs text-gold">{u.active ? "Disable account" : "Enable account"}</button></form></li>)}</ul></div>);
}
