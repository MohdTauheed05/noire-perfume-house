import "../src/db/env";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../src/db/firestore";
import { newId } from "../src/lib/store";

/**
 * Attaches real photos from public/products/ to products in Firestore.
 *   <product-slug>.jpg        -> main image   (e.g. dior-sauvage.jpg)
 *   <product-slug>-2.jpg ...  -> extra gallery images, in numeric order
 * Replaces the generated placeholder. Safe to re-run: already-linked files are skipped.
 * The filenames you need are listed in public/products/FILENAMES.txt
 */
const DIR = path.join(process.cwd(), "public", "products");
const RE = /^(.+?)(?:-(\d+))?\.(jpe?g|png|webp)$/i;

async function main() {
  if (!fs.existsSync(DIR)) { console.error("public/products/ not found"); process.exit(1); }
  const db = getDb();
  const products = (await db.collection("products").get()).docs;
  const bySlug = new Map(products.map((d) => [d.data().slug as string, d]));
  // Product slugs can themselves end in -<digits> (e.g. "rabanne-1-million"), so try the full stem first.
  const found = new Map<string, { file: string; n: number }[]>(); const unmatched: string[] = [];
  for (const file of fs.readdirSync(DIR)) {
    const m = RE.exec(file); if (!m) continue;
    const stem = file.replace(/\.[^.]+$/, "");
    if (bySlug.has(stem)) { (found.get(stem) ?? found.set(stem, []).get(stem)!).push({ file, n: 1 }); continue; }
    if (m[2] && bySlug.has(m[1])) { (found.get(m[1]) ?? found.set(m[1], []).get(m[1])!).push({ file, n: Number(m[2]) }); continue; }
    unmatched.push(file);
  }
  let linked = 0;
  for (const [slug, files] of found) {
    const doc = bySlug.get(slug)!; const p = doc.data();
    const images = ((p.images ?? []) as { id: string; mediaId: string; path: string; alt: string | null; isPlaceholder: boolean }[]).filter((i) => !i.isPlaceholder);
    const toAdd: typeof images = [];
    for (const { file } of files.sort((a, b) => a.n - b.n)) {
      const publicPath = `/products/${file}`;
      if (images.some((i) => i.path === publicPath)) continue;
      const mediaId = newId(); const alt = `${p.brandName} ${p.name}`;
      await db.collection("media").doc(mediaId).set({ path: publicPath, alt, isPlaceholder: false, createdAt: Date.now() });
      toAdd.push({ id: newId(), mediaId, path: publicPath, alt, isPlaceholder: false }); linked++;
    }
    if (!toAdd.length) continue;
    // real photos first (main = first), placeholders dropped now that a real photo exists
    await doc.ref.update({ images: [...images, ...toAdd] });
    console.log(`✔ ${slug}: +${toAdd.length} image(s)`);
  }
  const missing = products.filter((d) => !found.has(d.data().slug) && ((d.data().images ?? []) as { isPlaceholder: boolean }[]).every((i) => i.isPlaceholder)).map((d) => d.data().slug);
  console.log(`\nLinked ${linked} new image(s).`);
  if (unmatched.length) console.log(`Ignored (filename does not match any product slug): ${unmatched.join(", ")}`);
  if (missing.length) console.log(`Still using placeholders (${missing.length}): ${missing.join(", ")}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
