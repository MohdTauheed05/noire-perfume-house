"use client";
import { useState } from "react";
import { ProductImage } from "./ProductImage";
export function Gallery({ images, name }: { images: { path: string; alt: string | null }[]; name: string }) {
  const [i, setI] = useState(0); const [zoom, setZoom] = useState(false);
  const list = images.length ? images : [{ path: "", alt: name }]; const cur = list[i];
  return (<div>
    <button onClick={() => setZoom(true)} className="block aspect-[4/5] w-full cursor-zoom-in overflow-hidden border border-white/10" aria-label="Enlarge image">
      <ProductImage src={cur.path || null} alt={cur.alt ?? name} className="h-full w-full" /></button>
    {list.length > 1 && <div className="mt-3 flex gap-2">{list.map((im, n) => <button key={n} onClick={() => setI(n)} aria-label={`Image ${n + 1}`} aria-pressed={n === i} className={`h-20 w-16 overflow-hidden border ${n === i ? "border-gold" : "border-white/10"}`}><ProductImage src={im.path || null} alt="" className="h-full w-full" /></button>)}</div>}
    {zoom && <div role="dialog" aria-modal="true" aria-label="Enlarged image" className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setZoom(false)} onKeyDown={(e) => e.key === "Escape" && setZoom(false)}>
      <button autoFocus className="absolute right-4 top-4 text-sm uppercase tracking-widest" onClick={() => setZoom(false)}>Close</button>
      <ProductImage src={cur.path || null} alt={cur.alt ?? name} className="max-h-[90vh] w-auto max-w-full" /></div>}
  </div>);
}
