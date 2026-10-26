import Link from "next/link";
export default function NotFound() { return <div className="grid min-h-[50vh] place-items-center text-center"><div><h1 className="h-display text-6xl text-champagne">404</h1><p className="mt-2 text-white/60">This page has faded away.</p><Link href="/shop" className="btn-gold mt-6">Shop fragrances</Link></div></div>; }
