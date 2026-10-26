import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
/** Defense in depth only: verifies the session JWT signature. The DB role check (requireAdmin) in every page/action/route is the real gate. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const token = req.cookies.get("noire_session")?.value;
  const secret = process.env.SESSION_SECRET;
  let ok = false;
  if (token && secret) { try { await jwtVerify(token, new TextEncoder().encode(secret)); ok = true; } catch {} }
  if (!ok) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone(); url.pathname = "/admin/login"; url.search = ""; return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
