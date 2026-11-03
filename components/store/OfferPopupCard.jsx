"use client";

import Image from "next/image";
import Link from "next/link";
import { Tag, X } from "lucide-react";
import { brand } from "@/data/brand";
import { normalizeOffer } from "@/lib/storeOffer";
import { cn } from "@/lib/utils";

export default function OfferPopupCard({
  offer: rawOffer,
  onClose,
  onShop,
  preview = false,
  className,
}) {
  const offer = normalizeOffer(rawOffer);
  const message = offer.message || "Every product is included. The discount is already on the price.";
  const image = offer.image;

  return (
    <div
      className={cn(
        "offer-popup relative w-full max-w-[440px] overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_70px_-24px_rgba(15,39,68,0.65)] ring-1 ring-black/5",
        className
      )}
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-brand-primary">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Image
            src={brand.heroBanner}
            alt=""
            fill
            className="object-cover"
            sizes="440px"
            priority={preview}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-primary-dark/95 via-brand-primary/35 to-brand-primary/10" />
        <div className="pointer-events-none absolute -right-6 top-8 h-24 w-24 rounded-full bg-brand-accent/25 blur-2xl" />

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-primary shadow-md transition hover:bg-white"
            aria-label="Close offer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-brand-accent px-3 py-1.5 text-brand-primary shadow-md">
          <Tag className="h-3.5 w-3.5" aria-hidden />
          <span className="text-xs font-black uppercase tracking-wide">Storewide offer</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0 flex-1 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-accent">
              {brand.name}
            </p>
            <p id="offer-popup-title" className="mt-2 line-clamp-3 text-lg font-black leading-snug sm:text-xl">
              {message}
            </p>
          </div>
          <div
            className="flex h-[84px] w-[84px] shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-accent text-brand-primary shadow-lg ring-4 ring-white/90 sm:h-[92px] sm:w-[92px]"
            aria-label={`${offer.percent} percent off`}
          >
            <span className="text-3xl font-black leading-none sm:text-[2rem]">{offer.percent}%</span>
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em]">off</span>
          </div>
        </div>
      </div>

      <div className="bg-brand-cream px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <p className="text-center text-sm leading-6 text-neutral-600">
          Applied on every product at checkout. No promo code needed.
        </p>
        {preview ? (
          <div className="mt-4 flex h-12 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white opacity-90">
            Shop the offer
          </div>
        ) : (
          <Link
            href="/products"
            onClick={onShop}
            className="mt-4 flex h-12 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-primary-dark"
          >
            Shop the offer
          </Link>
        )}
        {onClose && !preview ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 flex h-10 w-full items-center justify-center text-sm font-semibold text-neutral-500 hover:text-brand-primary"
          >
            Maybe later
          </button>
        ) : null}
      </div>
    </div>
  );
}
