"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { useStoreOffer } from "@/context/StoreOfferContext";
import { isOfferActive } from "@/lib/storeOffer";
import { brand } from "@/data/brand";

const SEEN_KEY = "budybear-offer-popup-session";

export default function OfferPopup() {
  const pathname = usePathname();
  const offer = useStoreOffer();
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => {
    try {
      window.sessionStorage.setItem(SEEN_KEY, `${offer.percent}:${offer.message}`);
    } catch {
      // Ignore private browsing storage failures.
    }
    setOpen(false);
  }, [offer.percent, offer.message]);

  useEffect(() => {
    if (!isOfferActive(offer) || pathname?.startsWith("/admin")) return;
    const signature = `${offer.percent}:${offer.message}`;
    try {
      if (window.sessionStorage.getItem(SEEN_KEY) === signature) return;
    } catch {
      return;
    }
    setOpen(true);
  }, [offer, pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  if (!open || pathname?.startsWith("/admin")) return null;

  const message = offer.message || "Every product is included. The discount is already on the price.";

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-brand-primary-dark/70 backdrop-blur-sm"
        aria-label="Dismiss offer"
        onClick={dismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-popup-title"
        className="offer-popup relative w-full max-w-[420px] overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_70px_-24px_rgba(15,39,68,0.7)]"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary via-[#1a3d5c] to-[#234e6d] px-6 pb-8 pt-5 text-white">
          <div className="pointer-events-none absolute -left-10 -top-12 h-28 w-28 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -right-8 top-16 h-16 w-16 rounded-full bg-brand-accent/20" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image
                src={brand.logo}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-accent"
              />
              <div>
                <p className="text-sm font-bold leading-none">{brand.name}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-accent">
                  {brand.tagline}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Close offer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative mt-7 flex items-center gap-2 text-brand-accent">
            <Sparkles className="h-4 w-4" />
            <p className="text-[11px] font-bold uppercase tracking-[0.28em]">Running now</p>
          </div>
          <h2 id="offer-popup-title" className="relative mt-3 text-[1.7rem] font-black leading-tight">
            A softer price on every piece
          </h2>
        </div>

        <div className="relative flex justify-center bg-white">
          <div className="absolute top-0 h-px w-full bg-brand-cream" />
          <div className="-mt-7 flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-brand-accent text-brand-primary shadow-lg ring-[5px] ring-white">
            <span className="text-[1.7rem] font-black leading-none">{offer.percent}%</span>
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em]">off</span>
          </div>
        </div>

        <div className="bg-white px-6 pb-6 pt-4">
          <p className="px-2 text-balance text-center text-base font-semibold leading-6 text-brand-primary">{message}</p>
          <p className="mt-2 text-center text-sm leading-5 text-neutral-500">
            Applied on every product. No code to enter.
          </p>
          <Link
            href="/products"
            onClick={dismiss}
            className="mt-5 flex h-12 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-primary-dark"
          >
            Shop the offer
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 flex h-10 w-full items-center justify-center text-sm font-semibold text-neutral-500 hover:text-brand-primary"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
