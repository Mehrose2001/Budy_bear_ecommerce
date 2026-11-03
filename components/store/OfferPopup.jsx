"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import OfferPopupCard from "@/components/store/OfferPopupCard";
import { useStoreOffer } from "@/context/StoreOfferContext";
import { isOfferActive, offerSessionSignature } from "@/lib/storeOffer";

const SEEN_KEY = "budybear-offer-popup-session";

export default function OfferPopup() {
  const pathname = usePathname();
  const offer = useStoreOffer();
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => {
    try {
      window.sessionStorage.setItem(SEEN_KEY, offerSessionSignature(offer));
    } catch {
      // Ignore private browsing storage failures.
    }
    setOpen(false);
  }, [offer]);

  useEffect(() => {
    if (!isOfferActive(offer) || pathname?.startsWith("/admin")) return;
    const signature = offerSessionSignature(offer);
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

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-brand-primary-dark/70 backdrop-blur-sm"
        aria-label="Dismiss offer"
        onClick={dismiss}
      />
      <div role="dialog" aria-modal="true" aria-labelledby="offer-popup-title" className="relative z-10 w-full max-w-[440px]">
        <OfferPopupCard offer={offer} onClose={dismiss} onShop={dismiss} />
      </div>
    </div>
  );
}
