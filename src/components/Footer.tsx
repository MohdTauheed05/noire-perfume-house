"use client";
import Link from "next/link";
import { useActionState } from "react";
import { subscribe } from "@/app/actions";
export function Footer({ name }: { name: string }) {
  const [st, action, pending] = useActionState(subscribe, undefined);
  return (
    <footer className="mt-24 border-t border-white/10 bg-charcoal">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div><p className="h-display text-lg tracking-[0.3em] text-champagne">{name}</p><p className="mt-3 text-sm text-white/60">Exceptional fragrances from iconic houses.</p></div>
        <nav aria-label="Customer service" className="flex flex-col gap-2 text-sm text-white/70"><span className="label">Customer service</span>
          <Link href="/contact">Contact</Link><Link href="/shipping-returns">Shipping &amp; Returns</Link><Link href="/about">About</Link></nav>
        <nav aria-label="Legal" className="flex flex-col gap-2 text-sm text-white/70"><span className="label">Legal</span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
        <form action={action}><label htmlFor="nl" className="label">Newsletter</label>
          <div className="flex gap-2"><input id="nl" name="email" type="email" required placeholder="you@email.com" className="input" /><button disabled={pending} className="btn-gold !px-4">Join</button></div>
          {st?.error && <p role="alert" className="mt-2 text-xs text-red-400">{st.error}</p>}{st && "ok" in st && st.ok && <p role="status" className="mt-2 text-xs text-gold">Thank you for subscribing.</p>}</form>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs text-white/40">© {new Date().getFullYear()} {name}.</p>
    </footer>);
}
