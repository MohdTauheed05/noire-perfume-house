import { Timestamp, type DocumentData } from "firebase-admin/firestore";

/* ---------------------------------------------------------------------------
 * Firestore collections (all prices are integer fils: AED x 100)
 *   users/{id}              userEmails/{sha256(email)}   (email uniqueness lock)
 *   brands/{id}             categories/{id}              media/{id}
 *   products/{id}           variants, images, categoryIds, variantIds are EMBEDDED in the product document
 *   coupons/{CODE}          orders/{id}                  items[] embedded in the order document
 *   stockMovements/{id}     auditLogs/{id}               subscribers/{sha256(email)}
 *   settings/main           homepageSections/{id}        addresses/{id}
 * ------------------------------------------------------------------------- */

export type Audience = "MEN" | "WOMEN" | "UNISEX";
export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type Brand = { id: string; name: string; slug: string; description: string | null; country: string | null; website: string | null; logoMediaId: string | null; featured: boolean; published: boolean };
export type Category = { id: string; name: string; slug: string; description: string | null; parentId: string | null; sortOrder: number; published: boolean };
export type Media = { id: string; path: string; alt: string | null; isPlaceholder: boolean; createdAt: number };
export type Variant = { id: string; sku: string; sizeMl: number; priceCents: number; salePriceCents: number | null; stock: number };
export type ProductImage = { id: string; mediaId: string; path: string; alt: string | null; isPlaceholder: boolean };
export type Product = {
  id: string; name: string; slug: string; brandId: string; brandName: string; brandSlug: string; description: string; audience: Audience;
  family: string | null; concentration: string; topNotes: string | null; heartNotes: string | null; baseNotes: string | null;
  status: ProductStatus; seoTitle: string | null; createdAt: number; variants: Variant[]; images: ProductImage[]; categoryIds: string[];
};
export type User = { id: string; email: string; name: string | null; passwordHash: string; role: "CUSTOMER" | "ADMIN"; active: boolean; orderCount: number; createdAt: Date };
export type Address = { id: string; userId: string; line1: string; city: string; country: string; phone: string | null };
export type Coupon = { id: string; code: string; type: "PERCENT" | "FIXED"; value: number; minSubtotalCents: number; startsAt: Date | null; expiresAt: Date | null; usageLimit: number | null; used: number; active: boolean };
export type OrderItem = { id: string; variantId: string; name: string; qty: number; unitCents: number };
export type Order = {
  id: string; userId: string | null; status: string; paymentStatus: string; subtotalCents: number; discountCents: number; shippingCents: number; taxCents: number; totalCents: number;
  notes: string | null; contactEmail: string | null; shippingName: string | null; shippingPhone: string | null; shippingAddress: string | null; shippingCity: string | null;
  items: OrderItem[]; createdAt: Date;
};
export type StockMovement = { id: string; variantId: string; delta: number; reason: string; createdAt: Date };
export type AuditLog = { id: string; actorId: string | null; action: string; entity: string; entityId: string | null; createdAt: Date };
export type HomepageSection = { id: string; type: string; title: string | null; content: string | null; position: number; visible: boolean };

export const toDate = (v: unknown): Date | null => (v instanceof Timestamp ? v.toDate() : v instanceof Date ? v : typeof v === "number" ? new Date(v) : null);
const s = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const n = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);

export const mapBrand = (id: string, d: DocumentData): Brand => ({ id, name: d.name, slug: d.slug, description: s(d.description), country: s(d.country), website: s(d.website), logoMediaId: s(d.logoMediaId), featured: !!d.featured, published: d.published !== false });
export const mapCategory = (id: string, d: DocumentData): Category => ({ id, name: d.name, slug: d.slug, description: s(d.description), parentId: s(d.parentId), sortOrder: n(d.sortOrder), published: d.published !== false });
export const mapMedia = (id: string, d: DocumentData): Media => ({ id, path: d.path, alt: s(d.alt), isPlaceholder: d.isPlaceholder !== false, createdAt: n(d.createdAt) });
export const mapVariant = (d: DocumentData): Variant => ({ id: d.id, sku: d.sku, sizeMl: n(d.sizeMl), priceCents: n(d.priceCents), salePriceCents: typeof d.salePriceCents === "number" ? d.salePriceCents : null, stock: n(d.stock) });
export const mapImage = (d: DocumentData): ProductImage => ({ id: d.id, mediaId: d.mediaId, path: d.path, alt: s(d.alt), isPlaceholder: !!d.isPlaceholder });
export const mapProduct = (id: string, d: DocumentData): Product => ({
  id, name: d.name, slug: d.slug, brandId: d.brandId, brandName: d.brandName ?? "", brandSlug: d.brandSlug ?? "", description: d.description ?? "", audience: d.audience,
  family: s(d.family), concentration: d.concentration ?? "", topNotes: s(d.topNotes), heartNotes: s(d.heartNotes), baseNotes: s(d.baseNotes),
  status: d.status ?? "PUBLISHED", seoTitle: s(d.seoTitle), createdAt: n(d.createdAt),
  variants: ((d.variants ?? []) as DocumentData[]).map(mapVariant).sort((a, b) => a.sizeMl - b.sizeMl),
  images: ((d.images ?? []) as DocumentData[]).map(mapImage), categoryIds: (d.categoryIds ?? []) as string[],
});
export const mapUser = (id: string, d: DocumentData): User => ({ id, email: d.email, name: s(d.name), passwordHash: d.passwordHash, role: d.role === "ADMIN" ? "ADMIN" : "CUSTOMER", active: d.active !== false, orderCount: n(d.orderCount), createdAt: toDate(d.createdAt) ?? new Date(0) });
export const mapAddress = (id: string, d: DocumentData): Address => ({ id, userId: d.userId, line1: d.line1, city: d.city, country: d.country ?? "AE", phone: s(d.phone) });
export const mapCoupon = (id: string, d: DocumentData): Coupon => ({ id, code: d.code ?? id, type: d.type, value: n(d.value), minSubtotalCents: n(d.minSubtotalCents), startsAt: toDate(d.startsAt), expiresAt: toDate(d.expiresAt), usageLimit: typeof d.usageLimit === "number" ? d.usageLimit : null, used: n(d.used), active: d.active !== false });
export const mapOrder = (id: string, d: DocumentData): Order => ({
  id, userId: s(d.userId), status: d.status ?? "PENDING", paymentStatus: d.paymentStatus ?? "DEMO_UNPAID", subtotalCents: n(d.subtotalCents), discountCents: n(d.discountCents), shippingCents: n(d.shippingCents),
  taxCents: n(d.taxCents), totalCents: n(d.totalCents), notes: s(d.notes), contactEmail: s(d.contactEmail), shippingName: s(d.shippingName), shippingPhone: s(d.shippingPhone),
  shippingAddress: s(d.shippingAddress), shippingCity: s(d.shippingCity), items: ((d.items ?? []) as DocumentData[]).map((i, k) => ({ id: `${id}-${k}`, variantId: i.variantId, name: i.name, qty: n(i.qty), unitCents: n(i.unitCents) })),
  createdAt: toDate(d.createdAt) ?? new Date(0),
});
export const mapMovement = (id: string, d: DocumentData): StockMovement => ({ id, variantId: d.variantId, delta: n(d.delta), reason: d.reason ?? "", createdAt: toDate(d.createdAt) ?? new Date(0) });
export const mapAudit = (id: string, d: DocumentData): AuditLog => ({ id, actorId: s(d.actorId), action: d.action, entity: d.entity, entityId: s(d.entityId), createdAt: toDate(d.createdAt) ?? new Date(0) });
export const mapSection = (id: string, d: DocumentData): HomepageSection => ({ id, type: d.type, title: s(d.title), content: s(d.content), position: n(d.position), visible: d.visible !== false });
