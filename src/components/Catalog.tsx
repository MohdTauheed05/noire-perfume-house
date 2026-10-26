import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { facets, listProducts, type Filters } from "@/lib/queries";

export async function Catalog({ f, path, forceCategory, forceBrand, title, lede }: { f: Filters; path: string; forceCategory?: string; forceBrand?: string; title: string; lede?: string }) {
  const [{ items, total, page, pages }, fx] = await Promise.all([listProducts(f, forceCategory, forceBrand), facets()]);
  const qs = (p: number) => { const u = new URLSearchParams(Object.entries(f).filter(([k, v]) => v && k !== "page") as [string, string][]); u.set("page", String(p)); return `${path}?${u}`; };
  const Sel = ({ name, label, opts }: { name: keyof Filters; label: string; opts: [string, string][] }) => (
    <div><label className="label" htmlFor={name}>{label}</label><select id={name} name={name} defaultValue={f[name] ?? ""} className="input"><option value="">All</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="h-display text-4xl text-champagne">{title}</h1>{lede && <p className="mt-2 max-w-2xl text-white/60">{lede}</p>}
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <form method="get" action={path} className="card h-fit space-y-4 p-4" aria-label="Filters">
          <div><label className="label" htmlFor="q">Search</label><input id="q" name="q" defaultValue={f.q} className="input" placeholder="Name, brand, note" /></div>
          {!forceBrand && <Sel name="brand" label="Brand" opts={fx.brands.map((b) => [b.slug, b.name])} />}
          {!forceCategory && <Sel name="category" label="Category" opts={fx.categories.map((c) => [c.slug, c.name])} />}
          <Sel name="audience" label="Audience" opts={[["men", "Men"], ["women", "Women"], ["unisex", "Unisex"]]} />
          <Sel name="family" label="Fragrance family" opts={fx.families.map((x) => [x, x])} />
          <Sel name="conc" label="Concentration" opts={fx.concs.map((x) => [x, x])} />
          <Sel name="size" label="Size" opts={[["50", "50 ml"], ["100", "100 ml"]]} />
          <div className="grid grid-cols-2 gap-2"><div><label className="label" htmlFor="min">Min AED</label><input id="min" name="min" type="number" min="0" defaultValue={f.min} className="input" /></div>
            <div><label className="label" htmlFor="max">Max AED</label><input id="max" name="max" type="number" min="0" defaultValue={f.max} className="input" /></div></div>
          <Sel name="stock" label="Availability" opts={[["in", "In stock only"]]} />
          <Sel name="sort" label="Sort by" opts={[["newest", "Newest"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["name", "Name A–Z"]]} />
          <button className="btn-gold w-full">Apply</button><Link href={path} className="block text-center text-xs text-white/50 hover:text-gold">Reset</Link>
        </form>
        <div><p className="mb-4 text-sm text-white/50" role="status">{total} fragrance{total === 1 ? "" : "s"}</p>
          {items.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            : <p className="card p-10 text-center text-white/60">No fragrances match these filters.</p>}
          {pages > 1 && <nav aria-label="Pagination" className="mt-10 flex flex-wrap justify-center gap-2">{Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
            <Link key={n} href={qs(n)} aria-current={n === page ? "page" : undefined} className={`grid h-10 w-10 place-items-center border ${n === page ? "border-gold bg-gold text-ink" : "border-white/20 hover:border-gold"}`}>{n}</Link>)}</nav>}
        </div>
      </div>
    </div>);
}
