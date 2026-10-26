/**
 * Uncached Firestore access. Used by admin pages, auth, checkout and CLI scripts.
 * Public catalog pages read through the cached wrappers in ./queries.ts instead.
 * Intentionally has no "server-only" / next imports so scripts and tests can use it.
 */
import crypto from "node:crypto";
import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { getDb } from "@/db/firestore";
import {
  mapAddress, mapAudit, mapBrand, mapCategory, mapCoupon, mapMedia, mapMovement, mapOrder, mapProduct, mapSection, mapUser,
  type Address, type AuditLog, type Brand, type Category, type Coupon, type HomepageSection, type Media, type Order, type Product, type StockMovement, type User,
} from "@/db/models";

export const col = (name: string) => getDb().collection(name);
export const newId = () => crypto.randomUUID();
export const emailKey = (email: string) => crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
const CHUNK = 30; // Firestore limit for "in" / "array-contains-any"

/* ---------- catalog ---------- */
export const fetchBrands = async (): Promise<Brand[]> => (await col("brands").get()).docs.map((d) => mapBrand(d.id, d.data()));
export const fetchCategories = async (): Promise<Category[]> => (await col("categories").get()).docs.map((d) => mapCategory(d.id, d.data()));
export const fetchProducts = async (): Promise<Product[]> => (await col("products").get()).docs.map((d) => mapProduct(d.id, d.data()));
export const fetchMedia = async (): Promise<Media[]> => (await col("media").get()).docs.map((d) => mapMedia(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt);
export async function fetchProduct(id: string): Promise<Product | null> {
  if (!id) return null;
  const d = await col("products").doc(id).get();
  return d.exists ? mapProduct(d.id, d.data()!) : null;
}
export async function fetchSettings(): Promise<Record<string, string>> {
  const d = await col("settings").doc("main").get();
  return (d.data() ?? {}) as Record<string, string>;
}
export const fetchSections = async (): Promise<HomepageSection[]> => (await col("homepageSections").get()).docs.map((d) => mapSection(d.id, d.data())).sort((a, b) => a.position - b.position);

/** Products that contain any of the given variant ids (variants are embedded; `variantIds` is the lookup index). Pass `tx` to read inside a transaction. */
export async function productsByVariantIds(ids: string[], tx?: Transaction): Promise<Product[]> {
  const out = new Map<string, Product>();
  for (let i = 0; i < ids.length; i += CHUNK) {
    const q = col("products").where("variantIds", "array-contains-any", ids.slice(i, i + CHUNK));
    const snap = await (tx ? tx.get(q) : q.get());
    for (const d of snap.docs) out.set(d.id, mapProduct(d.id, d.data()));
  }
  return [...out.values()];
}
/** Firestore document body for a product (the id lives in the document path, not in the data). Keeps the `variantIds` lookup index in sync. */
export function productDoc(p: Omit<Product, "id"> & { id?: string }): Record<string, unknown> {
  const doc: Record<string, unknown> = { ...p };
  delete doc.id;
  doc.variantIds = p.variants.map((v) => v.id);
  return doc;
}

/* ---------- users ---------- */
export async function fetchUser(id: string): Promise<User | null> {
  if (!id) return null;
  const d = await col("users").doc(id).get();
  return d.exists ? mapUser(d.id, d.data()!) : null;
}
export async function fetchUserByEmail(email: string): Promise<User | null> {
  const snap = await col("users").where("email", "==", email.trim().toLowerCase()).limit(1).get();
  return snap.empty ? null : mapUser(snap.docs[0].id, snap.docs[0].data());
}
export class DuplicateEmailError extends Error {}
/** Creates a user and atomically claims the email (throws DuplicateEmailError if taken). */
export async function createUser(u: { email: string; name: string | null; passwordHash: string; role: "CUSTOMER" | "ADMIN" }): Promise<User> {
  const email = u.email.trim().toLowerCase(); const id = newId(); const lock = col("userEmails").doc(emailKey(email));
  await getDb().runTransaction(async (tx) => {
    if ((await tx.get(lock)).exists) throw new DuplicateEmailError();
    tx.set(lock, { userId: id });
    tx.set(col("users").doc(id), { email, name: u.name, passwordHash: u.passwordHash, role: u.role, active: true, orderCount: 0, createdAt: new Date() });
  });
  return (await fetchUser(id))!;
}
export const fetchAddresses = async (userId: string): Promise<Address[]> => (await col("addresses").where("userId", "==", userId).get()).docs.map((d) => mapAddress(d.id, d.data()));

/* ---------- orders / coupons / logs ---------- */
export async function fetchOrder(id: string): Promise<Order | null> {
  if (!id) return null;
  const d = await col("orders").doc(id).get();
  return d.exists ? mapOrder(d.id, d.data()!) : null;
}
export async function fetchOrdersForUser(userId: string): Promise<Order[]> {
  const snap = await col("orders").where("userId", "==", userId).get(); // sorted in memory: avoids a composite index
  return snap.docs.map((d) => mapOrder(d.id, d.data())).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
export async function fetchRecentOrders(limit: number, from?: Date, to?: Date): Promise<Order[]> {
  let q = col("orders").orderBy("createdAt", "desc");
  if (from) q = q.where("createdAt", ">=", from);
  if (to) q = q.where("createdAt", "<=", to);
  return (await q.limit(limit).get()).docs.map((d) => mapOrder(d.id, d.data()));
}
export const fetchCoupons = async (): Promise<Coupon[]> => (await col("coupons").get()).docs.map((d) => mapCoupon(d.id, d.data())).sort((a, b) => a.code.localeCompare(b.code));
export const fetchCoupon = async (code: string): Promise<Coupon | null> => {
  const id = code.trim().toUpperCase(); if (!id || id.includes("/")) return null;
  const d = await col("coupons").doc(id).get(); return d.exists ? mapCoupon(d.id, d.data()!) : null;
};
export const fetchRecentMovements = async (limit: number): Promise<StockMovement[]> => (await col("stockMovements").orderBy("createdAt", "desc").limit(limit).get()).docs.map((d) => mapMovement(d.id, d.data()));
export const fetchAuditFor = async (entityId: string): Promise<AuditLog[]> => (await col("auditLogs").where("entityId", "==", entityId).get()).docs.map((d) => mapAudit(d.id, d.data())).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

export const auditDoc = (actorId: string | null, action: string, entity: string, entityId?: string | null) => ({ actorId, action, entity, entityId: entityId ?? null, createdAt: new Date() });
export const writeAudit = (actorId: string | null, action: string, entity: string, entityId?: string | null) => col("auditLogs").add(auditDoc(actorId, action, entity, entityId));
export const movementDoc = (variantId: string, delta: number, reason: string) => ({ variantId, delta, reason, createdAt: new Date() });

/** Deletes every document matching a query, in batches. */
export async function deleteWhere(collection: string, field: string, op: "==" | "in", value: unknown) {
  const q = col(collection).where(field, op, value);
  for (;;) {
    const snap = await q.limit(400).get(); if (snap.empty) return;
    const b = getDb().batch(); snap.docs.forEach((d) => b.delete(d.ref)); await b.commit();
  }
}
export { FieldValue };
