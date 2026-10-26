"use client";

import { useState } from "react";
import { REMOTE_DEMO_PRODUCT_IMAGES } from "@/lib/demo-product-images";

const HERO_BOTTLE = REMOTE_DEMO_PRODUCT_IMAGES["jean-paul-gaultier-scandal"];
const FALLBACK_BOTTLE = REMOTE_DEMO_PRODUCT_IMAGES["dior-sauvage"];

export function StaticBottle() {
  const [src, setSrc] = useState(HERO_BOTTLE);
  const [usingFallback, setUsingFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div role="img" aria-label="Perfume bottle" className="grid h-full w-full place-items-center">
        <svg viewBox="0 0 200 300" className="h-4/5 text-gold/70" aria-hidden>
          <rect x="80" y="10" width="40" height="40" fill="currentColor" />
          <rect x="90" y="50" width="20" height="16" fill="currentColor" />
          <rect x="40" y="66" width="120" height="210" rx="10" fill="currentColor" fillOpacity=".55" />
        </svg>
      </div>
    );
  }

  return (
    <div role="img" aria-label="Jean Paul Gaultier Scandal perfume bottle" className="grid h-full w-full place-items-center overflow-visible">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Jean Paul Gaultier Scandal perfume bottle"
        referrerPolicy="no-referrer"
        fetchPriority="high"
        onError={() => {
          if (!usingFallback) {
            setUsingFallback(true);
            setSrc(FALLBACK_BOTTLE);
          } else {
            setFailed(true);
          }
        }}
        className="h-full w-full object-contain drop-shadow-[0_24px_45px_rgba(0,0,0,0.45)] [mix-blend-mode:multiply] motion-safe:animate-[hero-bottle-float_6s_ease-in-out_infinite]"
      />
    </div>
  );
}

export default function Hero3D() {
  return <StaticBottle />;
}
