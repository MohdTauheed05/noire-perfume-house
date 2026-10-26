import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getDb } from "@/db/firestore";
import type { Product } from "@/db/models";
import { adminAction, audit } from "@/lib/admin";
import { HttpError } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/queries";
import { MAX_UPLOAD, sniffImage, storage, storageConfigured } from "@/lib/storage";
import { col, newId } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const admin = await adminAction();
    if (!storageConfigured()) return NextResponse.json({ error: "Image uploads need Firebase Storage. Set FIREBASE_STORAGE_BUCKET (see README), or put photos in public/products/ and run npm run db:images." }, { status: 503 });
    const fd = await req.formData();
    const productId = String(fd.get("productId") ?? ""); const mode = String(fd.get("mode") ?? "add");
    const files = fd.getAll("files").filter((f): f is File => f instanceof File).slice(0, 20);
    if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });
    const out: { id: string; path: string }[] = []; const errors: string[] = [];
    for (const f of files) {
      const buf = Buffer.from(await f.arrayBuffer()); const ext = sniffImage(buf);
      if (!ext) { errors.push(`${f.name}: not a valid JPG/PNG/WebP under ${MAX_UPLOAD / 1024 / 1024} MB`); continue; }
      const { publicPath } = await storage.put(buf, ext);
      const alt = String(fd.get("alt") ?? "") || f.name.replace(/\.[^.]+$/, "");
      const mediaId = newId();
      await col("media").doc(mediaId).set({ path: publicPath, alt, isPlaceholder: false, createdAt: Date.now() });
      out.push({ id: mediaId, path: publicPath });
      if (productId) {
        await getDb().runTransaction(async (tx) => {
          const ref = col("products").doc(productId); const snap = await tx.get(ref); if (!snap.exists) return;
          const imgs = ((snap.data()!.images ?? []) as Product["images"]).slice();
          const entry = { id: newId(), mediaId, path: publicPath, alt, isPlaceholder: false };
          if (mode === "replaceMain") { if (imgs.length) imgs[0] = entry; else imgs.push(entry); } else imgs.push(entry);
          tx.update(ref, { images: imgs });
        });
      }
      await audit(admin.id, "MEDIA_UPLOAD", "media", mediaId);
    }
    revalidatePath("/", "layout"); revalidateTag(CATALOG_TAG);
    return NextResponse.json({ uploaded: out, errors });
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
