import Link from "next/link";
import { getUser } from "@/lib/auth";
import { CartBadge } from "./CartBadge";
import { getSettings } from "@/lib/queries";

const nav = [["Shop All", "/shop"], ["Brands", "/brands"], ["Men", "/categories/men"], ["Women", "/categories/women"], ["Unisex", "/categories/unisex"], ["New Arrivals", "/categories/new-arrivals"], ["Best Sellers", "/categories/best-sellers"]];
export async function Header() {
  const [user, st] = await Promise.all([getUser(), getSettings()]);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-gold focus:px-3 focus:py-2 focus:text-ink">Skip to content</a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="h-display text-xl tracking-[0.3em] text-champagne">{st.storeName ?? "NOIRÉ PERFUME HOUSE"}</Link>
        <nav aria-label="Main" className="hidden gap-6 text-[11px] uppercase tracking-[0.2em] lg:flex">
          {nav.map(([l, h]) => <Link key={h} href={h} className="hover:text-gold">{l}</Link>)}
        </nav>
        <div className="flex items-center gap-4 text-[11px] uppercase tracking-widest">
          <Link href="/search" className="hover:text-gold">Search</Link>
          <Link href={user ? "/account" : "/login"} className="hover:text-gold">{user ? "Account" : "Login"}</Link>
          <CartBadge />
        </div>
      </div>
      <nav aria-label="Mobile" className="flex gap-4 overflow-x-auto border-t border-white/5 px-4 py-2 text-[11px] uppercase tracking-widest lg:hidden">
        {nav.map(([l, h]) => <Link key={h} href={h} className="whitespace-nowrap hover:text-gold">{l}</Link>)}
      </nav>
    </header>);
}
