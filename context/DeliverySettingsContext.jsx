"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  DEFAULT_DELIVERY_SETTINGS,
  normalizeDeliverySettings,
} from "@/lib/deliverySettings";

const DeliverySettingsContext = createContext(DEFAULT_DELIVERY_SETTINGS);
const DeliverySetterContext = createContext(() => {});

function hasDeliveryPayload(delivery) {
  if (!delivery || typeof delivery !== "object") return false;
  return (
    (delivery.deliveryFee != null && delivery.deliveryFee !== "") ||
    (delivery.freeDeliveryThreshold != null && delivery.freeDeliveryThreshold !== "")
  );
}

export function DeliveryHydrator({ delivery }) {
  const setDelivery = useContext(DeliverySetterContext);

  useEffect(() => {
    if (!hasDeliveryPayload(delivery)) return;
    setDelivery(normalizeDeliverySettings(delivery));
  }, [delivery, setDelivery]);

  return null;
}

export function DeliverySettingsProvider({ children }) {
  const pathname = usePathname();
  const [delivery, setDelivery] = useState(DEFAULT_DELIVERY_SETTINGS);
  const value = useMemo(() => normalizeDeliverySettings(delivery), [delivery]);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return undefined;
    let ignore = false;

    const load = () => {
      fetch("/api/delivery-settings", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!ignore && data?.delivery) {
            setDelivery(normalizeDeliverySettings(data.delivery));
          }
        })
        .catch(() => {});
    };

    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      ignore = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname]);

  return (
    <DeliverySetterContext.Provider value={setDelivery}>
      <DeliverySettingsContext.Provider value={value}>
        {children}
      </DeliverySettingsContext.Provider>
    </DeliverySetterContext.Provider>
  );
}

export function useDeliverySettings() {
  return useContext(DeliverySettingsContext);
}
