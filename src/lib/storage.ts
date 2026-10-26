import "server-only";
import crypto from "node:crypto";
import { getStorage } from "firebase-admin/storage";
import { getDb } from "@/db/firestore";

export type ImageExt = "jpg" | "png" | "webp";
export interface StorageAdapter {
  put(data: Buffer, ext: ImageExt): Promise<{ publicPath: string }>;
  remove(publicPath: string): Promise<void>;
}
const TYPES: Record<ImageExt, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const HOST = "firebasestorage.googleapis.com";

/** True once FIREBASE_STORAGE_BUCKET is set (admin uploads need Firebase Storage). */
export const storageConfigured = () => !!process.env.FIREBASE_STORAGE_BUCKET?.trim();

/** Uploads to Firebase Storage and returns a long-lived tokenised download URL (no public ACLs or storage rules needed). */
class FirebaseStorage implements StorageAdapter {
  private bucket() {
    const name = process.env.FIREBASE_STORAGE_BUCKET?.trim();
    if (!name) throw new Error("FIREBASE_STORAGE_BUCKET is not set");
    getDb(); // makes sure the Admin app is initialised
    return getStorage().bucket(name);
  }
  async put(data: Buffer, ext: ImageExt) {
    const bucket = this.bucket(); const objectName = `products/${crypto.randomUUID()}.${ext}`; const token = crypto.randomUUID();
    await bucket.file(objectName).save(data, { resumable: false, metadata: { contentType: TYPES[ext], cacheControl: "public, max-age=31536000, immutable", metadata: { firebaseStorageDownloadTokens: token } } });
    return { publicPath: `https://${HOST}/v0/b/${bucket.name}/o/${encodeURIComponent(objectName)}?alt=media&token=${token}` };
  }
  async remove(publicPath: string) {
    if (!publicPath.includes(HOST)) return; // never delete placeholders or /products/* files that live in the git repo
    const m = /\/o\/([^?]+)/.exec(publicPath); if (!m) return;
    try { await this.bucket().file(decodeURIComponent(m[1])).delete({ ignoreNotFound: true }); } catch { /* best effort */ }
  }
}
export const storage: StorageAdapter = new FirebaseStorage();

/** Vercel serverless functions reject request bodies over ~4.5 MB, so each file is capped at 4 MB and uploaded in its own request. */
export const MAX_UPLOAD = 4 * 1024 * 1024;
/** Validate by magic bytes, not by client-supplied MIME type. */
export function sniffImage(buf: Buffer): ImageExt | null {
  if (buf.length > MAX_UPLOAD) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}
