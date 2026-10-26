"use client";
import { useState } from "react";
/** Never shows a broken image: falls back to a designed bottle silhouette. */
export function ProductImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  const [bad, setBad] = useState(!src);
  if (bad) return (
    <div role="img" aria-label={alt} className={`flex items-center justify-center bg-gradient-to-b from-charcoal to-ink ${className}`}>
      <svg viewBox="0 0 60 90" className="h-1/2 text-gold/70" aria-hidden><rect x="22" y="4" width="16" height="12" fill="currentColor" /><rect x="10" y="22" width="40" height="62" rx="6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
    </div>);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src!} alt={alt} loading="lazy" decoding="async" onError={() => setBad(true)} className={`object-cover ${className}`} />;
}
