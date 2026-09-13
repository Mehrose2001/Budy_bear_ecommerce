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

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIds(readWishlist());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      writeWishlist(ids);
    }
  }, [ids, isReady]);

  const hasItem = useCallback((productId) => ids.includes(productId), [ids]);

  const addItem = useCallback((productId) => {
    setIds((current) =>
      current.includes(productId) ? current : [productId, ...current]
    );
  }, []);

  const removeItem = useCallback((productId) => {
    setIds((current) => current.filter((id) => id !== productId));
  }, []);

  const toggleItem = useCallback((productId) => {
    setIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [productId, ...current]
    );
  }, []);

  const items = useMemo(
    () => ids.map(getProductById).filter(Boolean),
    [ids]
  );

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
