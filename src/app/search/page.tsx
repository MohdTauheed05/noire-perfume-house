import { Catalog } from "@/components/Catalog";
import type { Filters } from "@/lib/queries";
export const metadata = { title: "Search", robots: { index: false } };
export default async function Search({ searchParams }: { searchParams: Promise<Filters> }) { const f = await searchParams; return <Catalog f={f} path="/search" title={f.q ? `Results for “${f.q}”` : "Search"} />; }
