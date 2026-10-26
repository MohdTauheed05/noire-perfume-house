"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createSession, destroySession, getUser, hashPassword, verifyPassword } from "@/lib/auth";
import { CheckoutError, createOrder, planOrderQuote } from "@/lib/checkout";
import { getSettings, CATALOG_TAG } from "@/lib/queries";
import { rateLimit } from "@/lib/ratelimit";
import { col, createUser, DuplicateEmailError, emailKey, fetchCoupon, fetchUserByEmail } from "@/lib/store";

const cartSchema = z.array(z.object({ variantId: z.string().min(1), qty: z.number().int().min(1).max(20) })).max(50);
const ip = async () => (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";

export async function quoteCart(raw: unknown, couponCode?: string) {
  const cart = cartSchema.safeParse(raw); if (!cart.success) return { lines: [], totals: null, error: "Invalid cart", demo: true };
  const m = await getSettings();
  const coupon = couponCode?.trim() ? await fetchCoupon(couponCode) : null;
  const q = await planOrderQuote(cart.data, m, couponCode, coupon);
  return { ...q, demo: !m.paymentProvider };
}

const contactSchema = z.object({ email: z.string().email().max(200), name: z.string().min(2).max(100), phone: z.string().min(6).max(30), address: z.string().min(5).max(300), city: z.string().min(2).max(80) });
export async function placeOrder(raw: unknown, couponCode: string | undefined, contactRaw: unknown): Promise<{ orderId?: string; error?: string }> {
  if (!rateLimit(`order:${await ip()}`, 10)) return { error: "Too many attempts. Try again shortly." };
  const cart = cartSchema.safeParse(raw); if (!cart.success) return { error: "Invalid cart" };
  const contact = contactSchema.safeParse(contactRaw); if (!contact.success) return { error: "Please complete all delivery details correctly" };
  const user = await getUser();
  try {
    const order = await createOrder(user?.id ?? null, cart.data, couponCode, contact.data);
    revalidateTag(CATALOG_TAG); // stock changed
    return { orderId: order.id };
  } catch (e) { if (e instanceof CheckoutError) return { error: e.message }; console.error(e); return { error: "Could not place order" }; }
}

export async function productsBySlugs(slugs: string[]) {
  const { listBySlugs } = await import("@/lib/queries");
  return listBySlugs(z.array(z.string()).max(100).parse(slugs));
}

export type AuthState = { error?: string } | undefined;
const creds = z.object({ email: z.string().email().toLowerCase(), password: z.string().min(8).max(200) });
export async function register(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!rateLimit(`reg:${await ip()}`, 5)) return { error: "Too many attempts" };
  const p = creds.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!p.success) return { error: "Enter a valid email and a password of 8+ characters" };
  let id: string;
  try {
    const u = await createUser({ email: p.data.email, name: String(fd.get("name") ?? "").slice(0, 100) || null, passwordHash: await hashPassword(p.data.password), role: "CUSTOMER" });
    id = u.id;
  } catch (e) {
    if (e instanceof DuplicateEmailError) return { error: "An account with this email already exists" };
    console.error(e); return { error: "Could not create account" };
  }
  await createSession(id); redirect("/account");
}
export async function login(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = String(fd.get("email") ?? "").toLowerCase();
  if (!rateLimit(`login:${await ip()}:${email}`, 6)) return { error: "Too many attempts. Wait a minute." };
  const u = await fetchUserByEmail(email);
  const ok = u && u.active && (await verifyPassword(String(fd.get("password") ?? ""), u.passwordHash));
  if (!ok) return { error: "Invalid email or password" };
  await createSession(u.id);
  const next = String(fd.get("next") ?? ""); redirect(u.role === "ADMIN" && next.startsWith("/admin") ? next : u.role === "ADMIN" && fd.get("admin") ? "/admin" : "/account");
}
export async function logout() { await destroySession(); redirect("/"); }
export async function subscribe(_: AuthState, fd: FormData): Promise<AuthState & { ok?: boolean }> {
  const e = z.string().email().safeParse(fd.get("email")); if (!e.success) return { error: "Enter a valid email" };
  const email = e.data.toLowerCase();
  await col("subscribers").doc(emailKey(email)).set({ email, createdAt: new Date() }, { merge: true }); return { ok: true };
}
