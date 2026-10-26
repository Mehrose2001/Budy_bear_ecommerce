"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { EMPTY_OFFER, isOfferActive, normalizeOffer, offerHeadline } from "@/lib/storeOffer";

const StoreOfferContext = createContext(EMPTY_OFFER);
const OfferSetterContext = createContext(() => {});

export function OfferHydrator({ offer }) {
  const setOffer = useContext(OfferSetterContext);

  useEffect(() => {
    if (!offer) return;
    setOffer(normalizeOffer(offer));
  }, [offer, setOffer]);

  return null;
}

export function StoreOfferProvider({ children }) {
  const pathname = usePathname();
  const [offer, setOffer] = useState(EMPTY_OFFER);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return undefined;
    let ignore = false;
    fetch("/api/store-offer", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!ignore && data?.offer) setOffer(normalizeOffer(data.offer));
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [pathname]);

  const value = useMemo(() => offer, [offer]);
  return (
    <OfferSetterContext.Provider value={setOffer}>
      <StoreOfferContext.Provider value={value}>{children}</StoreOfferContext.Provider>
    </OfferSetterContext.Provider>
  );
}

export function useStoreOffer() {
  return useContext(StoreOfferContext);
}

export function useOfferHeadline() {
  const offer = useStoreOffer();
  return isOfferActive(offer) ? offerHeadline(offer) : "";
}
