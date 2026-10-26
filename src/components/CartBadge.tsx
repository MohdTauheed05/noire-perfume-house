"use client";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";
export function CartBadge() {
  const { count, wish } = useCart();
  return (<>
    <Link href="/wishlist" aria-label={`Wishlist, ${wish.length} items`} className="relative hover:text-gold"><Heart size={18} />{wish.length > 0 && <span className="absolute -right-2 -top-2 text-[10px] text-gold">{wish.length}</span>}</Link>
    <Link href="/cart" aria-label={`Cart, ${count} items`} className="relative hover:text-gold"><ShoppingBag size={18} /><span className="absolute -right-3 -top-3 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] text-ink">{count}</span></Link>
  </>);
}
