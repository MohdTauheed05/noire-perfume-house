"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
export type CartLine = { variantId: string; qty: number };
type Ctx = { cart: CartLine[]; count: number; add: (v: string, q?: number) => void; setQty: (v: string, q: number) => void; remove: (v: string) => void; clear: () => void;
  wish: string[]; toggleWish: (slug: string) => void; ready: boolean };
const C = createContext<Ctx | null>(null);
const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } };
/** Cart and wishlist live in the browser (guest-friendly); prices, stock and totals are ALWAYS recomputed server-side at quote/checkout. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]); const [wish, setWish] = useState<string[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => { setCart(read("noire.cart", [])); setWish(read("noire.wish", [])); setReady(true); }, []);
  useEffect(() => { if (ready) try { localStorage.setItem("noire.cart", JSON.stringify(cart)); localStorage.setItem("noire.wish", JSON.stringify(wish)); } catch {} }, [cart, wish, ready]);
  const add = useCallback((v: string, q = 1) => setCart((c) => c.some((l) => l.variantId === v) ? c.map((l) => l.variantId === v ? { ...l, qty: Math.min(20, l.qty + q) } : l) : [...c, { variantId: v, qty: q }]), []);
  const setQty = useCallback((v: string, q: number) => setCart((c) => q < 1 ? c.filter((l) => l.variantId !== v) : c.map((l) => l.variantId === v ? { ...l, qty: Math.min(20, q) } : l)), []);
  const remove = useCallback((v: string) => setCart((c) => c.filter((l) => l.variantId !== v)), []);
  const clear = useCallback(() => setCart([]), []);
  const toggleWish = useCallback((slug: string) => setWish((w) => w.includes(slug) ? w.filter((x) => x !== slug) : [...w, slug]), []);
  return <C.Provider value={{ cart, count: cart.reduce((a, l) => a + l.qty, 0), add, setQty, remove, clear, wish, toggleWish, ready }}>{children}</C.Provider>;
}
export const useCart = () => { const c = useContext(C); if (!c) throw new Error("CartProvider missing"); return c; };
