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
import {
  AUTH_CHANGED_EVENT,
  customerAuthHeaders,
  readCustomerAccessToken,
} from "@/lib/adminSession";
import {
  readGuestWishlistItems,
  snapshotProduct,
  writeGuestWishlistItems,
} from "@/lib/storage";

const WishlistContext = createContext(null);

function productId(value) {
  if (value && typeof value === "object") return Number(value.id);
  return Number(value);
}

function hydrateItems(items) {
  return (items || [])
    .map((item) => {
      if (item?.name && item?.images?.length) return item;
      const seeded = getProductById(item?.id ?? item);
      return seeded ? snapshotProduct(seeded) : snapshotProduct(item);
    })
    .filter(Boolean);
}

async function fetchAccountWishlist(token) {
  if (!token) return null;
  const response = await fetch("/api/wishlist", {
    headers: customerAuthHeaders(token),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Unable to load favourites.");
  const data = await response.json().catch(() => ({}));
  return hydrateItems(data.items || []);
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isAccount, setIsAccount] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const load = useCallback(async () => {
    const token = readCustomerAccessToken();
    if (!token) {
      setIsAccount(false);
      setItems(hydrateItems(readGuestWishlistItems()));
      setIsReady(true);
      return;
    }

    setIsAccount(true);
    setIsReady(false);
    try {
      const remote = await fetchAccountWishlist(token);
      if (!remote) {
        setIsAccount(false);
        setItems(hydrateItems(readGuestWishlistItems()));
        return;
      }
      setItems(remote);
    } catch {
      setItems([]);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(AUTH_CHANGED_EVENT, load);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, load);
  }, [load]);

  const persistGuest = useCallback((next) => {
    writeGuestWishlistItems(next);
  }, []);

  const hasItem = useCallback(
    (value) => items.some((item) => Number(item.id) === productId(value)),
    [items]
  );

  const addItem = useCallback(
    (productOrId) => {
      const snapshot = snapshotProduct(
        typeof productOrId === "object" ? productOrId : getProductById(productOrId) || { id: productOrId }
      );
      if (!snapshot) return;
      setItems((current) => {
        if (current.some((item) => Number(item.id) === snapshot.id)) return current;
        const next = [snapshot, ...current];
        if (!readCustomerAccessToken()) persistGuest(next);
        return next;
      });

      const token = readCustomerAccessToken();
      if (!token) return;
      fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...customerAuthHeaders(token) },
        body: JSON.stringify({ productId: snapshot.id }),
      })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !Array.isArray(data.items)) return;
          setItems(hydrateItems(data.items));
        })
        .catch(() => {});
    },
    [persistGuest]
  );

  const removeItem = useCallback(
    (productOrId) => {
      const id = productId(productOrId);
      setItems((current) => {
        const next = current.filter((item) => Number(item.id) !== id);
        if (!readCustomerAccessToken()) persistGuest(next);
        return next;
      });

      const token = readCustomerAccessToken();
      if (!token) return;
      fetch(`/api/wishlist/${id}`, {
        method: "DELETE",
        headers: customerAuthHeaders(token),
      })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !Array.isArray(data.items)) return;
          setItems(hydrateItems(data.items));
        })
        .catch(() => {});
    },
    [persistGuest]
  );

  const toggleItem = useCallback(
    (productOrId) => {
      if (hasItem(productOrId)) removeItem(productOrId);
      else addItem(productOrId);
    },
    [addItem, hasItem, removeItem]
  );

  const value = useMemo(
    () => ({
      ids: items.map((item) => item.id),
      items,
      count: items.length,
      isReady,
      isAccount,
      hasItem,
      addItem,
      removeItem,
      toggleItem,
      reload: load,
    }),
    [addItem, hasItem, isAccount, isReady, items, load, removeItem, toggleItem]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
