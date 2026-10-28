import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { facets, listProducts, type Filters } from "@/lib/queries";
import { CatalogFilters } from "./CatalogFilters";

export async function Catalog({ f, path, forceCategory, forceBrand, title, lede }: { f: Filters; path: string; forceCategory?: string; forceBrand?: string; title: string; lede?: string }) {
  const [{ items, total, page, pages }, fx] = await Promise.all([listProducts(f, forceCategory, forceBrand), facets()]);
  const qs = (p: number) => { const u = new URLSearchParams(Object.entries(f).filter(([k, v]) => v && k !== "page") as [string, string][]); u.set("page", String(p)); return `${path}?${u}`; };
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="h-display text-4xl text-champagne">{title}</h1>{lede && <p className="mt-2 max-w-2xl text-white/60">{lede}</p>}
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <CatalogFilters f={f} path={path} forceCategory={forceCategory} forceBrand={forceBrand}
          brands={fx.brands.map((b) => [b.slug, b.name])} categories={fx.categories.map((c) => [c.slug, c.name])}
          families={fx.families.map((x) => [x, x])} concentrations={fx.concs.map((x) => [x, x])} />
        <div><p className="mb-4 text-sm text-white/50" role="status">{total} fragrance{total === 1 ? "" : "s"}</p>
          {items.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            : <p className="card p-10 text-center text-white/60">No fragrances match these filters.</p>}
          {pages > 1 && <nav aria-label="Pagination" className="mt-10 flex flex-wrap justify-center gap-2">{Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
            <Link key={n} href={qs(n)} aria-current={n === page ? "page" : undefined} className={`grid h-10 w-10 place-items-center border ${n === page ? "border-gold bg-gold text-ink" : "border-white/20 hover:border-gold"}`}>{n}</Link>)}</nav>}
        </div>
      </div>
    </div>);
}
