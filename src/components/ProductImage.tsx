"use client";
import { useState } from "react";
import { REMOTE_DEMO_PRODUCT_IMAGES } from "@/lib/demo-product-images";

/** Uses public demo product-image links for seeded placeholder products; uploaded/local assets take priority. */
export function ProductImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  const slug = src?.match(/^\/media\/placeholders\/([^/]+)\.svg$/)?.[1];
  const linkedImage = slug ? REMOTE_DEMO_PRODUCT_IMAGES[slug] : null;
  const displaySrc = linkedImage ?? src;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const bad = !displaySrc || failedSrc === displaySrc;
  if (bad) return (
    <div role="img" aria-label={alt.replace(/\s*\(placeholder image\)$/i, "")} className={`flex items-center justify-center bg-gradient-to-b from-charcoal to-ink ${className}`}>
      <svg viewBox="0 0 60 90" className="h-1/2 text-gold/70" aria-hidden><rect x="22" y="4" width="16" height="12" fill="currentColor" /><rect x="10" y="22" width="40" height="62" rx="6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
    </div>);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={displaySrc!} alt={linkedImage ? alt.replace(/\s*\(placeholder image\)$/i, "") : alt} referrerPolicy="no-referrer" loading="lazy" decoding="async" onError={() => setFailedSrc(displaySrc!)} className={`object-contain ${className}`} />;
}

