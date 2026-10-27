import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Card } from "@/lib/queries";
export function Section({ title, href, items }: { title: string; href?: string; items: Card[] }) {
  if (!items.length) return null;
  return (<section className="home-product-section mx-auto max-w-[1440px] px-5 pt-16 sm:px-8 lg:px-16 lg:pt-24" aria-labelledby={`s-${title}`}>
    <div className="home-section-heading mb-7"><div><p className="home-kicker">The NOIRÉ collection</p><h2 id={`s-${title}`} className="h-display mt-2 text-4xl text-[#f0e5d2] sm:text-5xl">{title}</h2></div>{href && <Link href={href} className="home-text-link">Shop the edit <span aria-hidden="true">↗</span></Link>}</div>
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
  </section>);
}
