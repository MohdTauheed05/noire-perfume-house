import { Catalog } from "@/components/Catalog";
import type { Filters } from "@/lib/queries";
export const metadata = { title: "Shop All Fragrances", alternates: { canonical: "/shop" } };
export default async function Shop({ searchParams }: { searchParams: Promise<Filters> }) { return <Catalog f={await searchParams} path="/shop" title="All Fragrances" />; }
