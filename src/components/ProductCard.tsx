"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { useCart } from "./CartProvider";
import { aed } from "@/lib/pricing";
import type { Card } from "@/lib/queries";

export function ProductCard({ p }: { p: Card }) {
  const { add, toggleWish, wish } = useCart();
  const liked = wish.includes(p.slug);
  return (
    <article className="product-card group relative flex flex-col">
      <Link href={`/product/${p.slug}`} className="product-card-image relative block aspect-[4/4.7] overflow-hidden">
        <ProductImage src={p.image} alt={p.alt} className="h-full w-full transition duration-700 group-hover:scale-[1.04]" />
        {p.onSale && <span className="product-card-badge">Special price</span>}
      </Link>
      <button aria-label={liked ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={liked} onClick={() => toggleWish(p.slug)} className="product-wishlist absolute right-3 top-3 rounded-full p-2 transition">
        <Heart size={17} strokeWidth={1.5} fill={liked ? "currentColor" : "none"} />
      </button>
      <div className="flex flex-1 flex-col gap-1 px-3 pb-4 pt-4 sm:px-5 sm:pb-5">
        <Link href={`/brands/${p.brandSlug}`} className="product-card-brand">{p.brand}</Link>
        <Link href={`/product/${p.slug}`} className="product-card-name h-display line-clamp-2 text-lg leading-tight sm:text-xl">{p.name}</Link>
        <p className="product-card-family text-xs">{p.concentration} <span aria-hidden="true">·</span> {p.family}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="product-card-price">From {aed(p.fromCents)}</span>
          {p.inStock && p.firstVariantId ? <button className="product-card-add" onClick={() => add(p.firstVariantId!)} aria-label={`Add ${p.name} to cart`}>Add <span aria-hidden="true">+</span></button> : <span className="product-card-soldout">Sold out</span>}
        </div>
      </div>
    </article>
  );
}
