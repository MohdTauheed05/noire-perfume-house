"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useCart } from "./CartProvider";
import { aed } from "@/lib/pricing";

type V = { id: string; sizeMl: number; priceCents: number; salePriceCents: number | null; stock: number; sku: string };
export function ProductBuy({ slug, variants }: { slug: string; variants: V[] }) {
  const first = variants.find((v) => v.stock > 0) ?? variants[0];
  const [vid, setVid] = useState(first?.id); const [qty, setQty] = useState(1); const [msg, setMsg] = useState("");
  const { add, toggleWish, wish } = useCart(); const router = useRouter();
  const v = variants.find((x) => x.id === vid); if (!v) return null;
  const price = v.salePriceCents ?? v.priceCents; const out = v.stock < 1; const max = Math.min(20, v.stock);
  return (
    <div className="space-y-5">
      <fieldset><legend className="label">Size</legend><div className="flex gap-2">{variants.map((x) => (
        <button key={x.id} type="button" aria-pressed={x.id === vid} onClick={() => { setVid(x.id); setQty(1); }} disabled={x.stock < 1}
          className={`border px-4 py-2 text-sm ${x.id === vid ? "border-gold bg-gold/10 text-champagne" : "border-white/20"} disabled:opacity-40`}>{x.sizeMl} ml{x.stock < 1 && " — sold out"}</button>))}</div></fieldset>
      <p className="text-2xl">{v.salePriceCents && <s className="mr-3 text-base text-white/40">{aed(v.priceCents)}</s>}{aed(price)}</p>
      <p className="text-xs text-white/50">SKU {v.sku} · {out ? "Out of stock" : v.stock <= 5 ? `Only ${v.stock} left` : "In stock"}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center border border-white/20"><button aria-label="Decrease quantity" className="px-3 py-2" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <span aria-live="polite" className="w-8 text-center">{qty}</span><button aria-label="Increase quantity" className="px-3 py-2" onClick={() => setQty(Math.min(max, qty + 1))}>+</button></div>
        <button disabled={out} className="btn-gold" onClick={() => { add(v.id, qty); setMsg("Added to cart"); }}>Add to cart</button>
        <button disabled={out} className="btn-ghost" onClick={() => { add(v.id, qty); router.push("/checkout"); }}>Buy now</button>
        <button aria-label="Toggle wishlist" aria-pressed={wish.includes(slug)} onClick={() => toggleWish(slug)} className="border border-white/20 p-3 hover:text-gold"><Heart size={18} fill={wish.includes(slug) ? "currentColor" : "none"} /></button>
      </div><p role="status" className="text-sm text-gold">{msg}</p>
    </div>);
}
