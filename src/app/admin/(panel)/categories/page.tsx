import { adminPage } from "@/lib/admin"; import { AForm, Field } from "@/components/admin/Form"; import { saveCategory, deleteCategory } from "../../actions"; import { fetchCategories } from "@/lib/store";
export default async function Cats() {
  await adminPage(); const cs = await fetchCategories(); cs.sort((a, b) => a.sortOrder - b.sortOrder);
  const form = (c?: typeof cs[number]) => (<AForm action={saveCategory} className="grid gap-3 md:grid-cols-3" submit={c ? "Save" : "Create category"}>{c && <input type="hidden" name="id" value={c.id} />}
    <Field n="name" l="Name" v={c?.name} req /><Field n="slug" l="Slug" v={c?.slug} /><Field n="sortOrder" l="Order" t="number" v={c?.sortOrder ?? 0} /><Field n="description" l="Description" v={c?.description} />
    <div><label className="label" htmlFor={`p${c?.id}`}>Parent</label><select id={`p${c?.id}`} name="parentId" defaultValue={c?.parentId ?? ""} className="input"><option value="">None</option>{cs.filter((x) => x.id !== c?.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={c ? c.published : true} />Published</label></AForm>);
  return (<div className="space-y-8"><h1 className="h-display text-3xl text-champagne">Categories</h1><details className="card p-4"><summary className="cursor-pointer text-gold">New category</summary><div className="mt-4">{form()}</div></details>
    {cs.map((c) => (<details key={c.id} className="card p-4"><summary className="cursor-pointer">{c.name} <span className="text-white/40">#{c.sortOrder}</span></summary><div className="mt-4 space-y-3">{form(c)}<form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><button className="text-xs text-red-400">Delete</button></form></div></details>))}</div>);
}
