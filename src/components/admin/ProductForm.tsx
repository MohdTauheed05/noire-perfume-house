import { AForm, Field } from "./Form"; import { saveProduct } from "@/app/admin/actions";
type Opt = { id: string; name: string };
type V = { id: string; sizeMl: number; sku: string; priceCents: number; salePriceCents: number | null; stock: number };
export function ProductForm({ p, brands, cats, selected, variants }: { p?: Record<string, string | null>; brands: Opt[]; cats: Opt[]; selected: string[]; variants: V[] }) {
  const rows: Partial<V>[] = [...variants, {}];
  const sel = (n: string, l: string, opts: [string, string][], v?: string | null) => <div><label className="label" htmlFor={n}>{l}</label><select id={n} name={n} defaultValue={v ?? ""} className="input">{opts.map(([a, b]) => <option key={a} value={a}>{b}</option>)}</select></div>;
  return (<AForm action={saveProduct} className="space-y-6" submit={p ? "Save product" : "Create product"}>
    {p && <input type="hidden" name="id" value={p.id!} />}
    <div className="grid gap-4 md:grid-cols-2"><Field n="name" l="Name" v={p?.name} req /><Field n="slug" l="Slug (auto if empty)" v={p?.slug} />
      {sel("brandId", "Brand", brands.map((b) => [b.id, b.name]), p?.brandId)}{sel("audience", "Audience", [["MEN", "Men"], ["WOMEN", "Women"], ["UNISEX", "Unisex"]], p?.audience)}
      {sel("concentration", "Concentration", ["EDT", "EDP", "Parfum", "Extrait", "EDC"].map((x) => [x, x]), p?.concentration)}{sel("status", "Status", [["DRAFT", "Draft"], ["PUBLISHED", "Published"], ["ARCHIVED", "Archived"]], p?.status ?? "DRAFT")}
      <Field n="family" l="Fragrance family" v={p?.family} /><Field n="seoTitle" l="SEO title" v={p?.seoTitle} />
      <Field n="topNotes" l="Top notes" v={p?.topNotes} /><Field n="heartNotes" l="Heart notes" v={p?.heartNotes} /><Field n="baseNotes" l="Base notes" v={p?.baseNotes} /></div>
    <div><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" required rows={5} defaultValue={p?.description ?? ""} className="input" /></div>
    <fieldset><legend className="label">Categories</legend><div className="flex flex-wrap gap-3 text-sm">{cats.map((c) => <label key={c.id} className="flex items-center gap-1"><input type="checkbox" name="categoryId" value={c.id} defaultChecked={selected.includes(c.id)} />{c.name}</label>)}</div></fieldset>
    <fieldset><legend className="label">Sizes &amp; pricing (AED) — blank last row adds a new size</legend>
      {rows.map((v, i) => (<div key={v.id ?? `n${i}`} className="mb-2 grid grid-cols-2 gap-2 md:grid-cols-5"><input type="hidden" name="vId" value={v.id ?? ""} />
        <input name="vSize" aria-label="Size ml" placeholder="ml" type="number" defaultValue={v.sizeMl} className="input" /><input name="vSku" aria-label="SKU" placeholder="SKU" defaultValue={v.sku} className="input" />
        <input name="vPrice" aria-label="Price" placeholder="Price" type="number" step="0.01" defaultValue={v.priceCents ? v.priceCents / 100 : ""} className="input" /><input name="vSale" aria-label="Sale price" placeholder="Sale price" type="number" step="0.01" defaultValue={v.salePriceCents ? v.salePriceCents / 100 : ""} className="input" />
        <input name="vStock" aria-label="Stock" placeholder="Stock" type="number" min="0" defaultValue={v.stock} className="input" /></div>))}</fieldset>
  </AForm>);
}
