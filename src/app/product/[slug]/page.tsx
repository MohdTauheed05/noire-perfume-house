import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/Gallery";
import { ProductBuy } from "@/components/ProductBuy";
import { Section } from "@/components/Grid";
import { getProduct } from "@/lib/queries";
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  const p = await getProduct((await params).slug); if (!p) return {};
  const t = p.seoTitle ?? `${p.brand.name} ${p.name} ${p.concentration}`;
  return { title: t, description: p.description.slice(0, 160), alternates: { canonical: `/product/${p.slug}` }, openGraph: { title: t, images: p.images[0]?.path ? [p.images[0].path] : [] } };
}
export default async function Product({ params }: P) {
  const p = await getProduct((await params).slug); if (!p) notFound();
  const low = Math.min(...p.variants.map((v) => v.salePriceCents ?? v.priceCents));
  const ld = { "@context": "https://schema.org", "@type": "Product", name: `${p.brand.name} ${p.name}`, brand: { "@type": "Brand", name: p.brand.name }, description: p.description,
    image: p.images.map((i) => i.path), sku: p.variants[0]?.sku, offers: { "@type": "Offer", priceCurrency: "AED", price: (low / 100).toFixed(2), availability: p.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } };
  const notes: [string, string | null][] = [["Top", p.topNotes], ["Heart", p.heartNotes], ["Base", p.baseNotes]];
  return (<>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-2">
      <Gallery images={p.images} name={p.name} />
      <div className="space-y-6">
        <div><Link href={`/brands/${p.brand.slug}`} className="text-xs uppercase tracking-[0.3em] text-gold">{p.brand.name}</Link>
          <h1 className="h-display mt-2 text-5xl text-champagne">{p.name}</h1><p className="mt-1 text-sm text-white/50">{p.concentration} · {p.family} · {p.audience.toLowerCase()}</p></div>
        <p className="text-white/75">{p.description}</p>
        <ProductBuy slug={p.slug} variants={p.variants} />
        <dl className="card grid grid-cols-3 gap-4 p-4 text-sm">{notes.map(([k, v]) => <div key={k}><dt className="label">{k} notes</dt><dd>{v ?? "—"}</dd></div>)}</dl>
        <p className="text-xs text-white/50">Shipping &amp; returns: see our <Link href="/shipping-returns" className="underline">policy</Link>. Reviews appear here once genuine customer reviews exist.</p>
      </div>
    </div>
    <Section title="You may also like" items={p.related} />
  </>);
}
