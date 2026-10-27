import Link from "next/link";
import { getUser } from "@/lib/auth";
import { CartBadge } from "./CartBadge";
import { getSettings } from "@/lib/queries";

const nav = [["Shop all", "/shop"], ["For him", "/categories/men"], ["For her", "/categories/women"], ["Unisex", "/categories/unisex"], ["Fragrance houses", "/brands"], ["New arrivals", "/categories/new-arrivals"], ["Best sellers", "/categories/best-sellers"]];
export async function Header() {
  const [user, st] = await Promise.all([getUser(), getSettings()]);
  return (
    <header className="store-header sticky top-0 z-40">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-gold focus:px-3 focus:py-2 focus:text-ink">Skip to content</a>
      <div className="store-announcement"><span aria-hidden="true">✦</span> A considered collection of the world’s most loved fragrances <span aria-hidden="true">✦</span></div>
      <div className="store-header-main mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-4 sm:px-8 lg:px-16">
        <Link href="/" className="store-wordmark"><span>{st.storeName ?? "NOIRÉ PERFUME HOUSE"}</span><small>THE FRAGRANCE HOUSE</small></Link>
        <nav aria-label="Main" className="store-nav hidden items-center gap-5 xl:flex">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="store-actions flex items-center gap-3 sm:gap-5">
          <Link href="/search" aria-label="Search" className="store-action-link"><span className="store-search-icon" aria-hidden="true" /> <span className="hidden sm:inline">Search</span></Link>
          <Link href={user ? "/account" : "/login"} className="store-action-link"><span className="hidden sm:inline">{user ? "Account" : "Login"}</span><span className="sm:hidden">{user ? "Account" : "Login"}</span></Link>
          <CartBadge />
        </div>
      </div>
      <nav aria-label="Shop" className="store-mobile-nav flex gap-6 overflow-x-auto px-4 py-3 xl:hidden">
        {nav.map(([label, href]) => <Link key={href} href={href} className="whitespace-nowrap">{label}</Link>)}
      </nav>
    </header>
  );
}
