"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { brand } from "@/data/brand";
import { cn } from "@/lib/utils";

function isJpeg(src) {
  return /\.jpe?g(\?|#|$)/i.test(String(src || ""));
}

export default function Hero({ banners = [] }) {
  const uploaded = banners.filter((banner) => banner?.image);
  const jpegs = uploaded.filter((banner) => isJpeg(banner.image));
  const others = uploaded.filter((banner) => !isJpeg(banner.image));
  const items = [...jpegs, ...others];
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState({});

  const visible = items.filter((banner) => !failed[banner.id || banner.image]);

  useEffect(() => {
    if (visible.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % visible.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [visible.length]);

  const safeIndex = visible.length ? index % visible.length : 0;
  const current = visible[safeIndex];

  return (
    <section className="group relative overflow-hidden bg-brand-cream">
      <div className="relative aspect-[2/1] min-h-[200px] w-full sm:aspect-[4096/2047]">
        {visible.length === 0 ? (
          <div className="absolute inset-0 bg-brand-cream" />
        ) : (
          visible.map((banner, slideIndex) => {
            const active = slideIndex === safeIndex;
            return (
              <img
                key={banner.id || banner.image}
                src={banner.image}
                alt={active ? banner.title || `${brand.name} banner` : ""}
                onError={() => {
                  setFailed((currentFailed) => ({
                    ...currentFailed,
                    [banner.id || banner.image]: true,
                  }));
                }}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-[opacity,filter,transform] duration-[2.2s] ease-in-out motion-reduce:transition-none",
                  active
                    ? "opacity-100 blur-0 scale-100"
                    : "pointer-events-none opacity-0 blur-md scale-[1.03]"
                )}
              />
            );
          })
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-brand-primary/0 transition-colors duration-300 group-hover:bg-brand-primary/15 group-focus-within:bg-brand-primary/15" />
      <Link
        href={current?.href || "/products"}
        className="hero-explore-cta absolute bottom-4 left-1/2 z-10 inline-flex w-max -translate-x-1/2 items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-lg sm:bottom-6 sm:px-8 sm:py-3.5 sm:text-base lg:bottom-8"
      >
        Explore the collection
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
