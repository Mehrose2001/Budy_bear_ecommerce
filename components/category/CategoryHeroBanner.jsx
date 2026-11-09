"use client";

import Image from "next/image";
import Link from "next/link";
import { normalizeCategoryBanner } from "@/lib/categoryBanner";
import { cn } from "@/lib/utils";

export default function CategoryHeroBanner({ banner, className }) {
  const data = normalizeCategoryBanner(banner);
  if (!data.enabled) return null;

  const desktopImage = data.image || data.videoPoster;
  const mobileImage = data.imageMobile || desktopImage;

  if (!desktopImage && !mobileImage) return null;

  return (
    <section
      className={cn(
        "relative mb-8 overflow-hidden rounded-3xl bg-brand-primary text-white ring-1 ring-border",
        className
      )}
    >
      <div className="relative min-h-[200px] sm:min-h-[260px] lg:min-h-[320px]">
        {mobileImage && (
          <Image
            src={mobileImage}
            alt=""
            fill
            className="object-cover sm:hidden"
            sizes="100vw"
            priority
          />
        )}
        {desktopImage && (
          <Image
            src={desktopImage}
            alt=""
            fill
            className={cn("object-cover", mobileImage && "hidden sm:block")}
            sizes="(max-width: 640px) 100vw, 1280px"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/90 via-brand-primary/40 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 lg:p-10">
          {data.heading && (
            <h1 className="max-w-2xl text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              {data.heading}
            </h1>
          )}
          {data.description && (
            <p className="mt-2 max-w-xl text-sm text-white/90 sm:text-base">{data.description}</p>
          )}
          {data.ctaLabel && data.ctaHref && (
            <Link
              href={data.ctaHref}
              className="mt-4 inline-flex w-fit rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-cream"
            >
              {data.ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
