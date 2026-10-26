"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/db/firestore";
import { mapCoupon, mapOrder, type Brand, type Product, type Variant } from "@/db/models";
import { adminAction, audit } from "@/lib/admin";
import { canTransition } from "@/lib/pricing";
import { CATALOG_TAG } from "@/lib/queries";
import { slugify } from "@/lib/slug";
import { storage } from "@/lib/storage";
import { auditDoc, col, deleteWhere, fetchBrands, fetchMedia, fetchProduct, fetchProducts, movementDoc, newId, productDoc, productsByVariantIds } from "@/lib/store";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;
const cents = (v: string) => Math.round(Number(v) * 100);
/** Re-render pages AND drop the cached catalog so storefront changes show immediately. */
const refresh = () => { revalidatePath("/", "layout"); revalidateTag(CATALOG_TAG); };
export type Res = { error?: string; ok?: boolean } | undefined;

/* ---------- Products ---------- */
const productSchema = z.object({ name: z.string().min(2).max(200), brandId: z.string().min(1), audience: z.enum(["MEN", "WOMEN", "UNISEX"]),
  concentration: z.string().min(1).max(40), description: z.string().min(1).max(5000), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]) });

export async function saveProduct(_: Res, fd: FormData): Promise<Res> {
  const admin = await adminAction();
  const id = str(fd, "id");
  const p = productSchema.safeParse({ name: str(fd, "name"), brandId: str(fd, "brandId"), audience: str(fd, "audience"), concentration: str(fd, "concentration"), description: str(fd, "description"), status: str(fd, "status") });
  if (!p.success) return { error: "Please complete all required fields" };
  const slug = slugify(str(fd, "slug") || p.data.name);
  if (!slug) return { error: "Slug cannot be empty" };
  const vIds = fd.getAll("vId").map(String), sizes = fd.getAll("vSize").map(String), skus = fd.getAll("vSku").map(String), prices = fd.getAll("vPrice").map(String), sales = fd.getAll("vSale").map(String), stocks = fd.getAll("vStock").map(String);
  const rows: { id: string; size: number; sku: string; price: number; sale: number | null; stock: number }[] = [];
  for (let i = 0; i < sizes.length; i++) {
    if (!sizes[i] && !prices[i] && !skus[i]) continue;
    const r = { id: vIds[i], size: Number(sizes[i]), sku: (skus[i] ?? "").trim(), price: cents(prices[i]), sale: sales[i] ? cents(sales[i]) : null, stock: Math.trunc(Number(stocks[i] || 0)) };
    if (!(r.size > 0) || !r.sku || !(r.price > 0) || r.stock < 0 || !Number.isFinite(r.stock) || (r.sale !== null && (r.sale <= 0 || r.sale >= r.price))) return { error: `Invalid variant row ${i + 1}: need size, SKU, price > 0, stock ≥ 0, and sale price below price` };
    rows.push(r);
  }
  if (!rows.length) return { error: "Add at least one size/variant" };
  if (new Set(rows.map((r) => r.sku.toLowerCase())).size !== rows.length) return { error: "Each size needs its own unique SKU" };

  const [all, brands] = await Promise.all([fetchProducts(), fetchBrands()]);
  if (all.some((x) => x.slug === slug && x.id !== id)) return { error: "Another product already uses this slug" };
  const taken = new Set(all.filter((x) => x.id !== id).flatMap((x) => x.variants.map((v) => v.sku.toLowerCase())));
  if (rows.some((r) => taken.has(r.sku.toLowerCase()))) return { error: "SKU or slug already exists" };
  const brand = brands.find((b) => b.id === p.data.brandId); if (!brand) return { error: "Choose a valid brand" };
  const categoryIds = fd.getAll("categoryId").map(String).filter(Boolean);
  const fields = { ...p.data, slug, brandName: brand.name, brandSlug: brand.slug, family: opt(fd, "family"), topNotes: opt(fd, "topNotes"), heartNotes: opt(fd, "heartNotes"), baseNotes: opt(fd, "baseNotes"), seoTitle: opt(fd, "seoTitle"), categoryIds };

  let pid = id;
  try {
    await getDb().runTransaction(async (tx) => {
      const ref = id ? col("products").doc(id) : col("products").doc(newId());
      const cur = id ? await tx.get(ref) : null;
      if (id && !cur?.exists) throw new Error("NOT_FOUND");
      const old: Product | null = cur ? { id, ...(cur.data() as Omit<Product, "id">) } as Product : null;
      const oldVariants: Variant[] = (old?.variants ?? []) as Variant[];
      const movements: ReturnType<typeof movementDoc>[] = [];
      const variants: Variant[] = [...oldVariants];
      for (const r of rows) {
        const base = { sku: r.sku, sizeMl: r.size, priceCents: r.price, salePriceCents: r.sale };
        if (r.id) {
          const i = variants.findIndex((v) => v.id === r.id); if (i < 0) continue;
          if (variants[i].stock !== r.stock) movements.push(movementDoc(r.id, r.stock - variants[i].stock, "Admin edit"));
          variants[i] = { id: r.id, ...base, stock: r.stock };
        } else {
          const vid = newId(); variants.push({ id: vid, ...base, stock: r.stock });
          if (r.stock) movements.push(movementDoc(vid, r.stock, "Initial stock"));
        }
      }
      variants.sort((a, b) => a.sizeMl - b.sizeMl);
      pid = ref.id;
      tx.set(ref, productDoc({ ...fields, images: old?.images ?? [], createdAt: old?.createdAt ?? Date.now(), variants } as Omit<Product, "id">));
      for (const m of movements) tx.set(col("stockMovements").doc(), m);
      tx.set(col("auditLogs").doc(), auditDoc(admin.id, id ? "PRODUCT_UPDATE" : "PRODUCT_CREATE", "product", ref.id));
    });
  } catch (e) { console.error(e); return { error: "Could not save product" }; }
  refresh(); if (!id) redirect(`/admin/products/${pid}/edit`); return { ok: true };
}
export async function setProductStatus(fd: FormData) {
  const a = await adminAction(); const st = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).parse(str(fd, "status")); const id = str(fd, "id");
  await col("products").doc(id).update({ status: st }); await audit(a.id, `PRODUCT_${st}`, "product", id); refresh();
}
/** Safe delete: products that appear on orders are archived instead, preserving order history. */
export async function deleteProduct(fd: FormData) {
  const a = await adminAction(); const id = str(fd, "id");
  const p = await fetchProduct(id);
  if (p) {
    const vids = p.variants.map((v) => v.id); let onOrders = false;
    for (let i = 0; i < vids.length && !onOrders; i += 30) onOrders = !(await col("orders").where("variantIds", "array-contains-any", vids.slice(i, i + 30)).limit(1).get()).empty;
    if (onOrders) { await col("products").doc(id).update({ status: "ARCHIVED" }); await audit(a.id, "PRODUCT_ARCHIVED_INSTEAD_OF_DELETE", "product", id); }
    else {
      await col("products").doc(id).delete();
      for (let i = 0; i < vids.length; i += 30) await deleteWhere("stockMovements", "variantId", "in", vids.slice(i, i + 30));
      await cleanMedia(p.images.map((i) => i.mediaId)); await audit(a.id, "PRODUCT_DELETE", "product", id);
    }
  }
  refresh(); redirect("/admin/products");
}
/** Deletes uploaded (non-placeholder) media that nothing references any more, including its file in Firebase Storage. */
async function cleanMedia(ids: string[]) {
  if (!ids.length) return;
  const [products, brands, media] = await Promise.all([fetchProducts(), fetchBrands(), fetchMedia()]);
  for (const id of ids) {
    const m = media.find((x) => x.id === id); if (!m || m.isPlaceholder) continue;
    if (products.some((p) => p.images.some((i) => i.mediaId === id)) || brands.some((b) => b.logoMediaId === id)) continue;
    await col("media").doc(id).delete(); await storage.remove(m.path);
  }
}
export async function productImageAction(fd: FormData) {
  const a = await adminAction(); const productId = str(fd, "productId"); const imgId = str(fd, "imageId"); const op = str(fd, "op");
  const removed: string[] = [];
  await getDb().runTransaction(async (tx) => {
    const ref = col("products").doc(productId); const snap = await tx.get(ref); if (!snap.exists) return;
    let imgs = ((snap.data()!.images ?? []) as Product["images"]).slice(); const i = imgs.findIndex((x) => x.id === imgId); if (i < 0) return;
    if (op === "remove") { removed.push(imgs[i].mediaId); imgs = imgs.filter((x) => x.id !== imgId); }
    else if (op === "main") imgs = [imgs[i], ...imgs.filter((x) => x.id !== imgId)];
    else if (op === "up" && i > 0) [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]];
    else if (op === "down" && i < imgs.length - 1) [imgs[i + 1], imgs[i]] = [imgs[i], imgs[i + 1]];
    tx.update(ref, { images: imgs });
  });
  await cleanMedia(removed); await audit(a.id, `PRODUCT_IMAGE_${op.toUpperCase()}`, "product", productId); refresh();
}

/* ---------- Brands ---------- */
export async function saveBrand(_: Res, fd: FormData): Promise<Res> {
  const a = await adminAction(); const id = str(fd, "id"); const name = str(fd, "name"); if (name.length < 2) return { error: "Name required" };
  const slug = slugify(str(fd, "slug") || name); if (!slug) return { error: "Slug cannot be empty" };
  const all = await fetchBrands();
  if (all.some((b) => b.id !== id && b.slug === slug)) return { error: "Slug already in use" };
  if (all.some((b) => b.id !== id && b.name.toLowerCase() === name.toLowerCase())) return { error: "Brand name must be unique" };
  const v: Omit<Brand, "id"> = { name, slug, description: opt(fd, "description"), country: opt(fd, "country"), website: opt(fd, "website"), logoMediaId: opt(fd, "logoMediaId"), featured: fd.has("featured"), published: fd.has("published") };
  const bid = id || newId();
  await col("brands").doc(bid).set(v);
  if (id) { // keep the denormalised brand name/slug on products in sync
    const snap = await col("products").where("brandId", "==", id).get();
    if (!snap.empty) { const b = getDb().batch(); snap.docs.forEach((d) => b.update(d.ref, { brandName: name, brandSlug: slug })); await b.commit(); }
  }
  await audit(a.id, id ? "BRAND_UPDATE" : "BRAND_CREATE", "brand", bid); refresh(); return { ok: true };
}
export async function deleteBrand(fd: FormData): Promise<void> {
  const a = await adminAction(); const id = str(fd, "id");
  const has = !(await col("products").where("brandId", "==", id).limit(1).get()).empty;
  if (has) { await col("brands").doc(id).update({ published: false }); await audit(a.id, "BRAND_UNPUBLISHED_INSTEAD_OF_DELETE", "brand", id); }
  else { await col("brands").doc(id).delete(); await audit(a.id, "BRAND_DELETE", "brand", id); }
  refresh();
}

/* ---------- Categories ---------- */
export async function saveCategory(_: Res, fd: FormData): Promise<Res> {
  const a = await adminAction(); const id = str(fd, "id"); const name = str(fd, "name"); if (name.length < 2) return { error: "Name required" };
  const slug = slugify(str(fd, "slug") || name); if (!slug) return { error: "Slug cannot be empty" };
  const dup = await col("categories").where("slug", "==", slug).get(); if (dup.docs.some((d) => d.id !== id)) return { error: "Slug already in use" };
  const parent = opt(fd, "parentId");
  const v = { name, slug, description: opt(fd, "description"), parentId: parent === id ? null : parent, sortOrder: Number(str(fd, "sortOrder") || 0), published: fd.has("published") };
  const cid = id || newId(); await col("categories").doc(cid).set(v);
  await audit(a.id, id ? "CATEGORY_UPDATE" : "CATEGORY_CREATE", "category", cid); refresh(); return { ok: true };
}
export async function deleteCategory(fd: FormData) {
  const a = await adminAction(); const id = str(fd, "id");
  const [kids, prods] = await Promise.all([col("categories").where("parentId", "==", id).get(), col("products").where("categoryIds", "array-contains", id).get()]);
  const b = getDb().batch();
  kids.docs.forEach((d) => b.update(d.ref, { parentId: null }));
  prods.docs.forEach((d) => b.update(d.ref, { categoryIds: FieldValue.arrayRemove(id) }));
  b.delete(col("categories").doc(id)); await b.commit();
  await audit(a.id, "CATEGORY_DELETE", "category", id); refresh();
}

/* ---------- Media ---------- */
export async function deleteMedia(fd: FormData) {
  const a = await adminAction(); const id = str(fd, "id");
  const [products, brands, media] = await Promise.all([fetchProducts(), fetchBrands(), fetchMedia()]);
  if (products.some((p) => p.images.some((i) => i.mediaId === id)) || brands.some((b) => b.logoMediaId === id)) return; // in use: refuse
  const m = media.find((x) => x.id === id); if (!m) return;
  await col("media").doc(id).delete(); await storage.remove(m.path); await audit(a.id, "MEDIA_DELETE", "media", id); refresh();
}
export async function assignMedia(fd: FormData) {
  const a = await adminAction(); const mediaId = str(fd, "mediaId"); const productId = str(fd, "productId"); if (!productId || !mediaId) return;
  await getDb().runTransaction(async (tx) => {
    const [pRef, mRef] = [col("products").doc(productId), col("media").doc(mediaId)];
    const [p, m] = await Promise.all([tx.get(pRef), tx.get(mRef)]); if (!p.exists || !m.exists) return;
    const imgs = ((p.data()!.images ?? []) as Product["images"]).slice();
    imgs.push({ id: newId(), mediaId, path: m.data()!.path, alt: m.data()!.alt ?? null, isPlaceholder: m.data()!.isPlaceholder !== false });
    tx.update(pRef, { images: imgs });
  });
  await audit(a.id, "MEDIA_ASSIGN", "product", productId); refresh();
}

/* ---------- Inventory ---------- */
export async function adjustStock(fd: FormData) {
  const a = await adminAction(); const id = str(fd, "variantId"); const delta = Math.trunc(Number(str(fd, "delta"))); const reason = str(fd, "reason") || "Manual adjustment";
  if (!delta || !id) return;
  await getDb().runTransaction(async (tx) => {
    const [p] = await productsByVariantIds([id], tx); if (!p) return;
    const v = p.variants.find((x) => x.id === id)!; if (v.stock + delta < 0) return;
    tx.update(col("products").doc(p.id), productDoc({ ...p, variants: p.variants.map((x) => (x.id === id ? { ...x, stock: x.stock + delta } : x)) }));
    tx.set(col("stockMovements").doc(), movementDoc(id, delta, reason));
    tx.set(col("auditLogs").doc(), auditDoc(a.id, "STOCK_ADJUST", "variant", id));
  }); refresh();
}

/* ---------- Orders ---------- */
export async function updateOrder(fd: FormData) {
  const a = await adminAction(); const id = str(fd, "id"); const to = str(fd, "status"); const note = str(fd, "notes");
  await getDb().runTransaction(async (tx) => {
    const ref = col("orders").doc(id); const snap = await tx.get(ref); if (!snap.exists) return;
    const o = mapOrder(snap.id, snap.data()!);
    const restock = to === "CANCELLED" && to !== o.status && canTransition(o.status, to);
    const products = restock ? await productsByVariantIds(o.items.map((i) => i.variantId), tx) : []; // reads before writes
    const patch: Record<string, unknown> = {};
    if (to && to !== o.status && canTransition(o.status, to)) {
      if (restock) {
        const back = new Map<string, number>(); for (const it of o.items) back.set(it.variantId, (back.get(it.variantId) ?? 0) + it.qty);
        for (const p of products) if (p.variants.some((v) => back.has(v.id)))
          tx.update(col("products").doc(p.id), productDoc({ ...p, variants: p.variants.map((v) => (back.has(v.id) ? { ...v, stock: v.stock + back.get(v.id)! } : v)) }));
        for (const [variantId, qty] of back) tx.set(col("stockMovements").doc(), movementDoc(variantId, qty, `Cancelled order ${id}`));
      }
      patch.status = to;
      tx.set(col("auditLogs").doc(), auditDoc(a.id, `ORDER_${o.status}_TO_${to}`, "order", id));
    }
    if (fd.has("notes")) patch.notes = note || null;
    if (Object.keys(patch).length) tx.update(ref, patch);
  }); refresh();
}

/* ---------- Customers ---------- */
export async function toggleCustomer(fd: FormData) {
  const a = await adminAction(); const id = str(fd, "id"); if (id === a.id) return; // cannot lock yourself out
  const ref = col("users").doc(id); const snap = await ref.get(); if (!snap.exists || snap.data()!.role === "ADMIN") return;
  const active = snap.data()!.active !== false; await ref.update({ active: !active });
  await audit(a.id, active ? "CUSTOMER_DISABLED" : "CUSTOMER_ENABLED", "user", id); refresh();
}

/* ---------- Coupons (document id = code) ---------- */
export async function saveCoupon(_: Res, fd: FormData): Promise<Res> {
  const a = await adminAction(); const oldId = str(fd, "id"); const code = str(fd, "code").toUpperCase().replace(/\s+/g, "");
  const type = z.enum(["PERCENT", "FIXED"]).safeParse(str(fd, "type")); const raw = Number(str(fd, "value"));
  if (!code || !type.success || !(raw > 0)) return { error: "Code, type and a positive value are required" };
  if (!/^[A-Z0-9_-]{2,40}$/.test(code)) return { error: "Code may only contain letters, numbers, - and _ (2–40 characters)" };
  const value = type.data === "PERCENT" ? Math.round(raw) : Math.round(raw * 100); if (type.data === "PERCENT" && value > 100) return { error: "Percentage cannot exceed 100" };
  const d = (k: string) => (str(fd, k) ? new Date(str(fd, k)) : null);
  const v = { code, type: type.data, value, minSubtotalCents: Math.round(Number(str(fd, "min") || 0) * 100), startsAt: d("startsAt"), expiresAt: d("expiresAt"), usageLimit: str(fd, "usageLimit") ? Math.trunc(Number(str(fd, "usageLimit"))) : null, active: fd.has("active") };
  try {
    await getDb().runTransaction(async (tx) => {
      const ref = col("coupons").doc(code); const cur = await tx.get(ref);
      if (!oldId || oldId !== code) {
        if (cur.exists) throw new Error("EXISTS");
        const prev = oldId ? await tx.get(col("coupons").doc(oldId)) : null; // renaming: carry usage over, remove old doc
        tx.set(ref, { ...v, used: prev?.exists ? mapCoupon(prev.id, prev.data()!).used : 0 }); if (prev?.exists) tx.delete(prev.ref);
      } else tx.set(ref, v, { merge: true });
    });
  } catch { return { error: "Coupon code already exists" }; }
  await audit(a.id, oldId ? "COUPON_UPDATE" : "COUPON_CREATE", "coupon", code); return { ok: true };
}
export async function deleteCoupon(fd: FormData) { const a = await adminAction(); const id = str(fd, "id"); if (id) await col("coupons").doc(id).delete(); await audit(a.id, "COUPON_DELETE", "coupon", id); refresh(); }

/* ---------- Settings & homepage ---------- */
const SETTING_KEYS = ["storeName", "currency", "contactEmail", "contactPhone", "social_instagram", "social_facebook", "social_x", "vatPercent", "shippingFlatCents", "freeShippingOverCents", "seoDescription", "newsletterText", "footerText", "heroHeadline", "heroSubtitle", "heroCta1Label", "heroCta1Href", "heroCta2Label", "heroCta2Href"];
async function putSettings(fd: FormData, keys: string[]) {
  const patch: Record<string, string> = {};
  for (const k of keys) if (fd.has(k)) { let value = str(fd, k); if (k === "shippingFlatCents" || k === "freeShippingOverCents") value = String(cents(value || "0")); if (k.endsWith("Href") && value && !/^(\/|https?:\/\/)/.test(value)) continue; patch[k] = value; }
  if (Object.keys(patch).length) await col("settings").doc("main").set(patch, { merge: true });
}
export async function saveSettings(_: Res, fd: FormData): Promise<Res> { const a = await adminAction(); await putSettings(fd, SETTING_KEYS); await audit(a.id, "SETTINGS_UPDATE", "settings"); refresh(); return { ok: true }; }
export async function saveHomepage(_: Res, fd: FormData): Promise<Res> {
  const a = await adminAction(); await putSettings(fd, ["heroHeadline", "heroSubtitle", "heroCta1Label", "heroCta1Href", "heroCta2Label", "heroCta2Href", "footerText"]);
  const b = getDb().batch();
  for (const id of fd.getAll("secId").map(String)) b.update(col("homepageSections").doc(id), { position: Number(str(fd, `pos_${id}`) || 0), visible: fd.has(`vis_${id}`), title: opt(fd, `title_${id}`), content: opt(fd, `content_${id}`) });
  await b.commit(); await audit(a.id, "HOMEPAGE_UPDATE", "homepage"); refresh(); return { ok: true };
}
