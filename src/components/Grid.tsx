import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Card } from "@/lib/queries";
export function Section({ title, href, items }: { title: string; href?: string; items: Card[] }) {
  if (!items.length) return null;
  return (<section className="mx-auto max-w-7xl px-4 pt-16" aria-labelledby={`s-${title}`}>
    <div className="mb-6 flex items-end justify-between"><h2 id={`s-${title}`} className="h-display text-3xl text-champagne">{title}</h2>{href && <Link href={href} className="text-xs uppercase tracking-widest text-gold hover:underline">View all</Link>}</div>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div></section>);
}
