import { adminPage } from "@/lib/admin"; import { AForm, Field } from "@/components/admin/Form"; import { saveBrand, deleteBrand } from "../../actions"; import { fetchBrands, fetchMedia } from "@/lib/store";
export default async function Brands() {
  await adminPage(); const [bs, media] = await Promise.all([fetchBrands(), fetchMedia()]); bs.sort((a, b) => a.name.localeCompare(b.name)); const mediaList = media.slice(0, 300);
  const form = (b?: typeof bs[number]) => (<AForm action={saveBrand} className="grid gap-3 md:grid-cols-3" submit={b ? "Save" : "Create brand"}>{b && <input type="hidden" name="id" value={b.id} />}
    <Field n="name" l="Name" v={b?.name} req /><Field n="slug" l="Slug" v={b?.slug} /><Field n="country" l="Country" v={b?.country} /><Field n="website" l="Website" v={b?.website} t="url" />
    <div><label className="label" htmlFor={`l${b?.id}`}>Logo</label><select id={`l${b?.id}`} name="logoMediaId" defaultValue={b?.logoMediaId ?? ""} className="input"><option value="">None</option>{mediaList.map((m) => <option key={m.id} value={m.id}>{m.alt ?? m.path}</option>)}</select></div>
    <Field n="description" l="Description" v={b?.description} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={b?.featured} />Featured</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={b ? b.published : true} />Published</label></AForm>);
  return (<div className="space-y-8"><h1 className="h-display text-3xl text-champagne">Brands</h1><details className="card p-4"><summary className="cursor-pointer text-gold">New brand</summary><div className="mt-4">{form()}</div></details>
    {bs.map((b) => (<details key={b.id} className="card p-4"><summary className="cursor-pointer">{b.name} {!b.published && <em className="text-white/40">(unpublished)</em>}</summary><div className="mt-4 space-y-3">{form(b)}
      <form action={deleteBrand}><input type="hidden" name="id" value={b.id} /><button className="text-xs text-red-400">Delete (unpublishes if it has products)</button></form></div></details>))}</div>);
}
