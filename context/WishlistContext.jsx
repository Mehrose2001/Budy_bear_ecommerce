"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProductById } from "@/data/products";
import { readWishlist, writeWishlist } from "@/lib/storage";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated, isReady: authReady, authHeaders } = useCustomerAuth();
  const [ids, setIds] = useState([]);
  const [remoteItems, setRemoteItems] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    setIds(readWishlist());
    setIsReady(true);
  }, [authReady]);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      writeWishlist(ids);
    }
  }, [ids, isReady, isAuthenticated]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      setRemoteItems(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const localIds = readWishlist();
        await Promise.all(
          localIds.map((productId) =>
            fetch("/api/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeaders },
              body: JSON.stringify({ productId }),
            }).catch(() => null)
          )
        );
        const response = await fetch("/api/wishlist", { headers: authHeaders });
        const data = await response.json().catch(() => ({}));
        if (cancelled || !response.ok) return;
        const items = data.items || [];
        setRemoteItems(items);
        setIds(items.map((item) => item.id));
        writeWishlist(items.map((item) => item.id));
      } catch {
        // Keep local favourites if the account wishlist is unavailable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, authHeaders, isAuthenticated]);

  const hasItem = useCallback((productId) => ids.includes(productId), [ids]);

  const addItem = useCallback(
    (productId) => {
      setIds((current) =>
        current.includes(productId) ? current : [productId, ...current]
      );
      if (isAuthenticated) {
        fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ productId }),
        }).catch(() => {});
      }
    },
    [authHeaders, isAuthenticated]
  );

  const removeItem = useCallback(
    (productId) => {
      setIds((current) => current.filter((id) => id !== productId));
      setRemoteItems((current) =>
        current ? current.filter((item) => item.id !== productId) : current
      );
      if (isAuthenticated) {
        fetch(`/api/wishlist/${productId}`, {
          method: "DELETE",
          headers: authHeaders,
        }).catch(() => {});
      }
    },
    [authHeaders, isAuthenticated]
  );

  const toggleItem = useCallback(
    (productId) => {
      if (ids.includes(productId)) {
        removeItem(productId);
      } else {
        addItem(productId);
      }
    },
    [addItem, ids, removeItem]
  );

  const items = useMemo(() => {
    if (remoteItems) return remoteItems;
    return ids.map(getProductById).filter(Boolean);
  }, [ids, remoteItems]);

  return (
    <WishlistContext.Provider
      value={{
        ids,
        items,
        count: items.length,
        isReady,
        hasItem,
        addItem,
        removeItem,
        toggleItem,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
