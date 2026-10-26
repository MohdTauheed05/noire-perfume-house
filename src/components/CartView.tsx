"use client";
import { useEffect, useState } from "react";
import { quoteCart } from "@/app/actions";
import { useCart } from "./CartProvider";
import { aed } from "@/lib/pricing";
export type Quote = Awaited<ReturnType<typeof quoteCart>>;
export function useQuote(coupon: string) {
  const { cart, ready, setQty, remove } = useCart(); const [q, setQ] = useState<Quote | null>(null);
  useEffect(() => { if (!ready) return; let live = true; quoteCart(cart, coupon).then((r) => { if (live) setQ(r); }); return () => { live = false; }; }, [cart, coupon, ready]);
  // reconcile: drop unavailable items and clamp quantities to stock so the cart never silently disagrees with the server
  useEffect(() => { if (!q) return; for (const c of cart) { const l = q.lines.find((x) => x.variantId === c.variantId); if (!l || l.stock < 1) remove(c.variantId); else if (l.qty < c.qty) setQty(c.variantId, l.qty); } }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  return q;
}
export function Totals({ q }: { q: NonNullable<Quote["totals"]> }) {
  const r = (l: string, v: number, neg = false) => <div className="flex justify-between"><dt>{l}</dt><dd>{neg ? "−" : ""}{aed(v)}</dd></div>;
  return (<dl className="space-y-2 text-sm">{r("Subtotal", q.subtotalCents)}{q.discountCents > 0 && r("Discount", q.discountCents, true)}{r("Shipping", q.shippingCents)}
    <div className="flex justify-between border-t border-white/10 pt-2 text-lg"><dt>Total</dt><dd>{aed(q.totalCents)}</dd></div><p className="text-xs text-white/40">Includes VAT of {aed(q.taxCents)}</p></dl>);
}
