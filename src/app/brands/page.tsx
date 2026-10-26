import Link from "next/link";
import { publishedBrands } from "@/lib/queries";
export const metadata = { title: "Brands", alternates: { canonical: "/brands" } };
export default async function Brands() {
  const bs = await publishedBrands();
  return (<div className="mx-auto max-w-7xl px-4 py-10"><h1 className="h-display text-4xl text-champagne">Fragrance Houses</h1>
    <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{bs.map((b) => <li key={b.id}><Link href={`/brands/${b.slug}`} className="card block p-6 text-center hover:border-gold"><span className="h-display text-xl">{b.name}</span><span className="mt-1 block text-xs text-white/50">{b.country}</span></Link></li>)}</ul></div>);
}
