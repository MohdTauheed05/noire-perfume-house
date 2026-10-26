import Link from "next/link";
import { adminPage } from "@/lib/admin";
import { logout } from "@/app/actions";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };
const links = [["Dashboard", "/admin"], ["Products", "/admin/products"], ["Brands", "/admin/brands"], ["Categories", "/admin/categories"], ["Media", "/admin/media"], ["Orders", "/admin/orders"], ["Customers", "/admin/customers"], ["Inventory", "/admin/inventory"], ["Coupons", "/admin/coupons"], ["Homepage", "/admin/homepage"], ["Settings", "/admin/settings"], ["Change password", "/admin/password"]];
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await adminPage();
  return (<div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[200px_1fr]">
    <nav aria-label="Admin" className="flex gap-2 overflow-x-auto md:flex-col md:gap-1">{links.map(([l, h]) => <Link key={h} href={h} className="whitespace-nowrap px-3 py-2 text-xs uppercase tracking-widest hover:bg-gold/10 hover:text-gold">{l}</Link>)}
      <form action={logout}><button className="px-3 py-2 text-xs uppercase tracking-widest text-white/50 hover:text-gold">Sign out</button></form></nav>
    <div className="min-w-0">{children}</div></div>);
}

