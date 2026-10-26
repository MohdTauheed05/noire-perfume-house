"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { ProductCard } from "@/components/ProductCard";
import { productsBySlugs } from "@/app/actions";
import type { Card } from "@/lib/queries";
export default function Wishlist() {
  const { wish, ready } = useCart(); const [items, setItems] = useState<Card[] | null>(null);
  useEffect(() => { if (ready) productsBySlugs(wish).then(setItems); }, [wish, ready]);
  return (<div className="mx-auto max-w-7xl px-4 py-10"><h1 className="h-display text-4xl text-champagne">Wishlist</h1>
    {items === null ? <p className="mt-6 text-white/50">Loading…</p> : items.length === 0 ? <p className="mt-6 text-white/60">Nothing saved yet. <Link href="/shop" className="text-gold underline">Browse fragrances</Link></p>
      : <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>}</div>);
}
