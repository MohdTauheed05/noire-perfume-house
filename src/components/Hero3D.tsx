"use client";

import { useEffect, useState } from "react";
import { REMOTE_DEMO_PRODUCT_IMAGES } from "@/lib/demo-product-images";

const HERO_BOTTLES = [
  { src: REMOTE_DEMO_PRODUCT_IMAGES["jean-paul-gaultier-scandal"], alt: "Jean Paul Gaultier Scandal perfume bottle" },
  { src: REMOTE_DEMO_PRODUCT_IMAGES["dior-sauvage"], alt: "Dior Sauvage perfume bottle" },
  { src: REMOTE_DEMO_PRODUCT_IMAGES["gucci-guilty-pour-homme"], alt: "Gucci Guilty Pour Homme perfume bottle" },
  { src: REMOTE_DEMO_PRODUCT_IMAGES["versace-bright-crystal"], alt: "Versace Bright Crystal perfume bottle" },
];

export function StaticBottle() {
  const [imageIndex, setImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<number[]>([]);
  const failed = failedImages.length >= HERO_BOTTLES.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setImageIndex((current) => {
        for (let offset = 1; offset <= HERO_BOTTLES.length; offset += 1) {
          const next = (current + offset) % HERO_BOTTLES.length;
          if (!failedImages.includes(next)) return next;
        }
        return current;
      });
    }, 7000);

    return () => window.clearInterval(interval);
  }, [failedImages]);

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

  const activeBottle = HERO_BOTTLES[imageIndex];

  return (
    <div className="grid h-full w-full place-items-center overflow-visible motion-safe:animate-[hero-bottle-float_6s_ease-in-out_infinite]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={imageIndex}
        src={activeBottle.src}
        alt={activeBottle.alt}
        referrerPolicy="no-referrer"
        fetchPriority={imageIndex === 0 ? "high" : "auto"}
        onError={() => {
          setFailedImages((current) => current.includes(imageIndex) ? current : [...current, imageIndex]);
          setImageIndex((current) => {
            for (let offset = 1; offset < HERO_BOTTLES.length; offset += 1) {
              const next = (imageIndex + offset) % HERO_BOTTLES.length;
              if (next !== current && !failedImages.includes(next)) return next;
            }
            return HERO_BOTTLES.length;
          });
        }}
        className="h-full w-full object-contain drop-shadow-[0_24px_45px_rgba(0,0,0,0.45)] rounded-2xl motion-safe:animate-[hero-bottle-appear_700ms_ease-out]"
      />
    </div>
  );
}

export default function Hero3D() {
  return <StaticBottle />;
}
