import "server-only";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { fetchUser } from "./store";

const secret = () => {
  const v = process.env.SESSION_SECRET;
  if (!v || v.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(v);
};
export const COOKIE = "noire_session";
export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h);

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("7d").sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false", path: "/", maxAge: 604800 });
}
export async function destroySession() { (await cookies()).delete(COOKIE); }

export async function getUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const u = await fetchUser(String(payload.uid));
    return u && u.active ? u : null;
  } catch { return null; }
}
export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }
export async function requireUser() { const u = await getUser(); if (!u) throw new HttpError(401, "Authentication required"); return u; }
/** Call at the top of EVERY admin page, server action and API route. Role is read from Firestore, never from the token. */
export async function requireAdmin() { const u = await requireUser(); if (u.role !== "ADMIN") throw new HttpError(403, "Forbidden"); return u; }
