"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { placeOrder } from "@/app/actions";
import { useCart } from "@/components/CartProvider";
import { Totals, useQuote } from "@/components/CartView";
function Inner() {
  const coupon = useSearchParams().get("coupon") ?? ""; const { cart, clear, ready } = useCart(); const q = useQuote(coupon); const router = useRouter();
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  if (!ready || !q) return <p className="p-10 text-white/50">Loading…</p>;
  if (!q.lines.length) return <p className="p-10">Your cart is empty. <Link href="/shop" className="text-gold underline">Shop</Link></p>;
  async function submit(fd: FormData) {
    setBusy(true); setErr("");
    const r = await placeOrder(cart, coupon, Object.fromEntries(["email", "name", "phone", "address", "city"].map((k) => [k, String(fd.get(k) ?? "")])));
    if (r.orderId) { clear(); router.push(`/order-confirmation/${r.orderId}`); } else { setErr(r.error ?? "Could not place order"); setBusy(false); }
  }
  const f = (n: string, l: string, t = "text") => <div><label className="label" htmlFor={n}>{l}</label><input id={n} name={n} type={t} required className="input" autoComplete={n} /></div>;
  return (<div className="mx-auto max-w-5xl px-4 py-10"><h1 className="h-display text-4xl text-champagne">Checkout</h1>
    {q.demo && <p role="note" className="mt-4 border border-gold/50 bg-gold/10 p-3 text-sm text-champagne"><strong>DEMO CHECKOUT.</strong> No payment provider is configured. No real payment is collected; the order is recorded as “demo – unpaid”.</p>}
    <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
      <form action={submit} className="space-y-4">{f("name", "Full name")}{f("email", "Email", "email")}{f("phone", "Phone", "tel")}{f("address", "Address")}{f("city", "City")}
        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}<button disabled={busy} className="btn-gold">{busy ? "Placing order…" : q.demo ? "Place demo order" : "Pay now"}</button></form>
      <aside className="card h-fit p-4">{q.error && <p role="alert" className="mb-2 text-xs text-red-400">{q.error}</p>}{q.totals && <Totals q={q.totals} />}</aside></div></div>);
}
export default function Checkout() { return <Suspense><Inner /></Suspense>; }
