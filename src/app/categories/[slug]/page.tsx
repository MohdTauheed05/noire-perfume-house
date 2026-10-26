import { notFound } from "next/navigation";
import { Catalog } from "@/components/Catalog";
import { getCategoryBySlug, type Filters } from "@/lib/queries";
type P = { params: Promise<{ slug: string }>; searchParams: Promise<Filters> };
const cat = getCategoryBySlug;
export async function generateMetadata({ params }: P) { const c = await cat((await params).slug); return c ? { title: c.name, description: c.description ?? undefined, alternates: { canonical: `/categories/${c.slug}` } } : {}; }
export default async function Page({ params, searchParams }: P) {
  const { slug } = await params; const c = await cat(slug); if (!c) notFound();
  return <Catalog f={await searchParams} path={`/categories/${slug}`} forceCategory={slug} title={c.name} lede={c.description ?? undefined} />;
}
