"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { useCart } from "./CartProvider";
import { aed } from "@/lib/pricing";
import type { Card } from "@/lib/queries";

export function ProductCard({ p }: { p: Card }) {
  const { add, toggleWish, wish } = useCart(); const liked = wish.includes(p.slug);
  return (
    <article className="group card relative flex flex-col">
      <Link href={`/product/${p.slug}`} className="block aspect-[4/5] overflow-hidden">
        <ProductImage src={p.image} alt={p.alt} className="h-full w-full transition duration-500 group-hover:scale-105" />
      </Link>
      <button aria-label={liked ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={liked} onClick={() => toggleWish(p.slug)} className="absolute right-3 top-3 rounded-full bg-ink/70 p-2 hover:text-gold">
        <Heart size={18} fill={liked ? "currentColor" : "none"} />
      </button>
      {p.onSale && <span className="absolute left-3 top-3 bg-gold px-2 py-1 text-[10px] uppercase tracking-widest text-ink">Sale</span>}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <Link href={`/brands/${p.brandSlug}`} className="text-[11px] uppercase tracking-[0.2em] text-gold">{p.brand}</Link>
        <Link href={`/product/${p.slug}`} className="h-display text-xl leading-tight hover:text-champagne">{p.name}</Link>
        <p className="text-xs text-white/50">{p.concentration} · {p.family}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm">From {aed(p.fromCents)}</span>
          {p.inStock && p.firstVariantId ? <button className="btn-ghost !px-3 !py-2" onClick={() => add(p.firstVariantId!)}>Add</button> : <span className="text-xs text-white/40">Sold out</span>}
        </div>
      </div>
    </article>);
}
