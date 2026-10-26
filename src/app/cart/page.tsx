"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { Totals, useQuote } from "@/components/CartView";
import { aed } from "@/lib/pricing";
export default function CartPage() {
  const { setQty, remove, ready } = useCart(); const [code, setCode] = useState(""); const [applied, setApplied] = useState("");
  const q = useQuote(applied);
  if (!ready || !q) return <p className="p-10 text-white/50">Loading cart…</p>;
  return (<div className="mx-auto max-w-5xl px-4 py-10"><h1 className="h-display text-4xl text-champagne">Your Cart</h1>
    {q.lines.length === 0 ? <p className="mt-6 text-white/60">Your cart is empty. <Link href="/shop" className="text-gold underline">Shop fragrances</Link></p> : (
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <ul className="space-y-3">{q.lines.map((l) => (<li key={l.variantId} className="card flex items-center justify-between gap-4 p-4">
          <div><Link href={`/product/${l.slug}`} className="h-display text-lg hover:text-champagne">{l.brand} {l.name}</Link><p className="text-xs text-white/50">{l.sizeMl} ml · {aed(l.unitCents)}{l.requested > l.qty && ` · only ${l.qty} available`}</p></div>
          <div className="flex items-center gap-2"><label className="sr-only" htmlFor={`q${l.variantId}`}>Quantity</label>
            <input id={`q${l.variantId}`} type="number" min={1} max={Math.min(20, l.stock)} value={l.qty} onChange={(e) => setQty(l.variantId, Number(e.target.value) || 1)} className="input !w-16" />
            <button onClick={() => remove(l.variantId)} className="text-xs uppercase tracking-widest text-white/50 hover:text-red-400">Remove</button></div></li>))}</ul>
        <aside className="card h-fit space-y-4 p-4"><form onSubmit={(e) => { e.preventDefault(); setApplied(code); }} className="flex gap-2"><label className="sr-only" htmlFor="cp">Coupon code</label>
          <input id="cp" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="input" /><button className="btn-ghost !px-3">Apply</button></form>
          {q.error && <p role="alert" className="text-xs text-red-400">{q.error}</p>}{q.totals && <Totals q={q.totals} />}
          <Link href={applied ? `/checkout?coupon=${encodeURIComponent(applied)}` : "/checkout"} className="btn-gold w-full">Checkout</Link></aside></div>)}</div>);
}
