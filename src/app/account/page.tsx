import Link from "next/link"; import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth"; import { logout } from "../actions"; import { fetchAddresses } from "@/lib/store";
export const metadata = { title: "My account", robots: { index: false } };
export default async function Account() {
  const u = await getUser(); if (!u) redirect("/login");
  const addrs = await fetchAddresses(u.id);
  return (<div className="mx-auto max-w-3xl px-4 py-10"><h1 className="h-display text-4xl text-champagne">My account</h1>
    <p className="mt-2 text-white/70">{u.name ?? u.email} · {u.email}</p>
    <div className="mt-6 flex gap-3"><Link href="/account/orders" className="btn-gold">Order history</Link>{u.role === "ADMIN" && <Link href="/admin" className="btn-ghost">Admin</Link>}
      <form action={logout}><button className="btn-ghost">Sign out</button></form></div>
    <h2 className="label mt-10">Saved addresses</h2>{addrs.length ? addrs.map((a) => <p key={a.id} className="card mt-2 p-3 text-sm">{a.line1}, {a.city}</p>) : <p className="text-sm text-white/50">None saved. Addresses entered at checkout are stored with each order.</p>}</div>);
}
