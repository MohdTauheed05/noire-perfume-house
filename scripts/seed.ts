import "../src/db/env";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../src/db/firestore";
import { BRANDS, CATEGORIES, PRODUCTS } from "../src/db/catalog";
import { slugify } from "../src/lib/slug";
import { newId } from "../src/lib/store";

/**
 * Seeds Firestore with the sample catalog (safe to re-run: existing brands/products/coupon/settings are skipped).
 *  - uses real photos from public/products/<product-slug>.(jpg|jpeg|png|webp) when present, otherwise the generated placeholder SVG
 *  - then run `npm run db:images` any time you add more photos
 */
const PROD_DIR = path.join(process.cwd(), "public", "products");
const PH_DIR = path.join(process.cwd(), "public", "media", "placeholders");
const EXTS = ["jpg", "jpeg", "png", "webp"];
const realPhoto = (slug: string) => { for (const e of EXTS) if (fs.existsSync(path.join(PROD_DIR, `${slug}.${e}`))) return `/products/${slug}.${e}`; return null; };

async function main() {
  const db = getDb(); const now = Date.now();
  const existing = async (c: string) => (await db.collection(c).get()).docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

  // brands
  const brandRows = (await existing("brands")) as { id: string; name: string; slug: string }[];
  for (const b of BRANDS) {
    if (brandRows.some((x) => x.slug === slugify(b.name))) continue;
    const id = newId(); const doc = { name: b.name, slug: slugify(b.name), country: b.country, featured: !!b.featured, published: true, description: `${b.name} — edit this description in the admin panel.`, website: null, logoMediaId: null };
    await db.collection("brands").doc(id).set(doc); brandRows.push({ id, name: b.name, slug: doc.slug });
  }
  // categories
  const catRows = (await existing("categories")) as { id: string; name: string; slug: string }[];
  for (const [i, c] of CATEGORIES.entries()) {
    if (catRows.some((x) => x.slug === slugify(c))) continue;
    const id = newId(); await db.collection("categories").doc(id).set({ name: c, slug: slugify(c), sortOrder: i, published: true, description: null, parentId: null }); catRows.push({ id, name: c, slug: slugify(c) });
  }
  const brandOf = (n: string) => brandRows.find((b) => b.slug === slugify(n))!;
  const catId = (n: string) => catRows.find((c) => c.slug === slugify(n))?.id;

  // products
  const have = new Set((await db.collection("products").get()).docs.map((d) => d.data().slug as string));
  let created = 0, real = 0;
  for (const [idx, [brand, name, aud, conc, fam, top, heart, base, price]] of PRODUCTS.entries()) {
    const slug = slugify(`${brand} ${name}`);
    if (have.has(slug)) continue;
    const mediaId = newId(); const photo = realPhoto(slug);
    const mediaPath = photo ?? `/media/placeholders/${slug}.svg`;
    if (!photo && !fs.existsSync(path.join(PH_DIR, `${slug}.svg`))) console.warn(`No placeholder file for ${slug}`);
    await db.collection("media").doc(mediaId).set({ path: mediaPath, alt: photo ? `${brand} ${name}` : `${brand} ${name} (placeholder image)`, isPlaceholder: !photo, createdAt: now });
    if (photo) real++;
    const variants = ([[50, 0.65], [100, 1]] as const).map(([ml, f]) => {
      const cents = Math.round(price * f) * 100;
      return { id: newId(), sku: `NOI-${String(idx + 1).padStart(3, "0")}-${ml}`, sizeMl: ml, priceCents: cents, salePriceCents: idx % 7 === 0 ? Math.round(cents * 0.9) : null, stock: 5 + ((idx * 3 + ml) % 25) };
    });
    const cats = [aud === "MEN" ? "Men" : aud === "WOMEN" ? "Women" : "Unisex", fam];
    if (idx < 8) cats.push("Best Sellers");
    if (idx >= PRODUCTS.length - 8) cats.push("New Arrivals");
    const pid = newId();
    await db.collection("products").doc(pid).set({
      name, slug, brandId: brandOf(brand).id, brandName: brand, brandSlug: slugify(brand), audience: aud, concentration: conc, family: fam, topNotes: top, heartNotes: heart, baseNotes: base,
      description: `${brand} ${name} (${conc}) — a ${fam.toLowerCase()} fragrance. Replace this text with your own product description in the admin panel.`,
      status: "PUBLISHED", seoTitle: null, createdAt: now - (PRODUCTS.length - idx) * 1000,
      images: [{ id: newId(), mediaId, path: mediaPath, alt: photo ? `${brand} ${name}` : `${brand} ${name} (placeholder image)`, isPlaceholder: !photo }],
      categoryIds: [...new Set(cats.map(catId).filter((x): x is string => !!x))], variants, variantIds: variants.map((v) => v.id),
    });
    for (const v of variants) await db.collection("stockMovements").add({ variantId: v.id, delta: v.stock, reason: "Initial seed", createdAt: new Date() });
    created++;
  }

  // coupon (document id = code)
  const cref = db.collection("coupons").doc("WELCOME10");
  if (!(await cref.get()).exists) await cref.set({ code: "WELCOME10", type: "PERCENT", value: 10, minSubtotalCents: 20000, startsAt: null, expiresAt: null, usageLimit: null, used: 0, active: true });

  // settings (never overwrites values you already edited)
  const sref = db.collection("settings").doc("main"); const cur = (await sref.get()).data() ?? {};
  const defaults: Record<string, string> = { storeName: "NOIRÉ PERFUME HOUSE", currency: "AED", vatPercent: "5", shippingFlatCents: "2500", freeShippingOverCents: "30000", heroHeadline: "DISCOVER YOUR SIGNATURE SCENT",
    heroSubtitle: "Explore exceptional fragrances from iconic houses and discover the scent that defines you." };
  const patch = Object.fromEntries(Object.entries(defaults).filter(([k]) => !(k in cur)));
  if (Object.keys(patch).length) await sref.set(patch, { merge: true });

  // homepage sections
  const secs = ["hero", "featured-brands", "men", "women", "unisex", "oud", "floral", "woody", "fresh", "best-sellers", "new-arrivals", "gift-sets", "editorial"];
  const haveSecs = (await db.collection("homepageSections").get()).docs.map((d) => d.data().type as string);
  for (const [i, t] of secs.entries()) if (!haveSecs.includes(t)) await db.collection("homepageSections").doc(newId()).set({ type: t, title: t, content: null, position: i, visible: true });

  console.log(`Seed ok. New products: ${created} (${real} with real photos, ${created - real} with placeholders). Brands: ${brandRows.length}.`);
  if (created - real > 0) console.log("Add real photos to public/products/<slug>.jpg and run: npm run db:images");
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
