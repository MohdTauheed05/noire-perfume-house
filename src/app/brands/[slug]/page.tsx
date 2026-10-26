import { notFound } from "next/navigation";
import { Catalog } from "@/components/Catalog";
import { getBrandBySlug, type Filters } from "@/lib/queries";
type P = { params: Promise<{ slug: string }>; searchParams: Promise<Filters> };
const brand = getBrandBySlug;
export async function generateMetadata({ params }: P) { const b = await brand((await params).slug); return b ? { title: b.name, description: b.description ?? undefined, alternates: { canonical: `/brands/${b.slug}` } } : {}; }
export default async function Page({ params, searchParams }: P) {
  const { slug } = await params; const b = await brand(slug); if (!b) notFound();
  return <Catalog f={await searchParams} path={`/brands/${slug}`} forceBrand={slug} title={b.name} lede={[b.country, b.description].filter(Boolean).join(" — ")} />;
}
