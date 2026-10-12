import {
  CART_STORAGE_KEY,
  ORDERS_STORAGE_KEY,
  RECENTLY_VIEWED_KEY,
  WISHLIST_STORAGE_KEY,
} from "@/data/store";

export function readStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / private mode failures.
  }
}

function readSession(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeSession(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function snapshotProduct(product) {
  if (!product || product.id == null) return null;
  return {
    id: Number(product.id),
    slug: product.slug || "",
    name: product.name || "Saved item",
    brand: product.brand || "Budy Bear",
    images: Array.isArray(product.images) && product.images.length ? product.images : ["/images/brand/logo.jpg"],
    price: Number(product.price || 0),
    salePrice: product.salePrice ?? null,
  };
}

function normalizeWishlistItems(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item && typeof item === "object") return snapshotProduct(item);
      const id = Number(item);
      return Number.isFinite(id) ? { id } : null;
    })
    .filter(Boolean);
}

export function readCart() {
  return readStorage(CART_STORAGE_KEY, []);
}

export function writeCart(items) {
  writeStorage(CART_STORAGE_KEY, items);
}

export function readWishlist() {
  return readGuestWishlistItems().map((item) => item.id);
}

export function writeWishlist(ids) {
  const current = readGuestWishlistItems();
  const next = (ids || []).map((id) => {
    const numeric = Number(id);
    return current.find((item) => Number(item.id) === numeric) || { id: numeric };
  });
  writeGuestWishlistItems(next);
}

export function readGuestWishlistItems() {
  const fromSession = normalizeWishlistItems(readSession(WISHLIST_STORAGE_KEY, null));
  if (fromSession.length) return fromSession;
  const fromLocal = normalizeWishlistItems(readStorage(WISHLIST_STORAGE_KEY, []));
  if (fromLocal.length) writeGuestWishlistItems(fromLocal);
  return fromLocal;
}

export function writeGuestWishlistItems(items) {
  writeSession(WISHLIST_STORAGE_KEY, normalizeWishlistItems(items));
}

export function readLocalOrders() {
  const fromSession = readSession(ORDERS_STORAGE_KEY, null);
  if (Array.isArray(fromSession) && fromSession.length) return fromSession;
  const fromLocal = readStorage(ORDERS_STORAGE_KEY, []);
  if (Array.isArray(fromLocal) && fromLocal.length) {
    writeSession(ORDERS_STORAGE_KEY, fromLocal);
  }
  return Array.isArray(fromLocal) ? fromLocal : [];
}

export function writeLocalOrders(orders) {
  writeSession(ORDERS_STORAGE_KEY, orders);
}

export function saveLocalOrder(order) {
  if (!order?.id) return;
  const current = readLocalOrders().filter((item) => item.id !== order.id);
  writeLocalOrders([order, ...current].slice(0, 20));
}

export function readRecentlyViewed() {
  return readStorage(RECENTLY_VIEWED_KEY, []);
}

export function writeRecentlyViewed(ids) {
  writeStorage(RECENTLY_VIEWED_KEY, ids);
}

export function trackRecentlyViewed(productId) {
  const current = readRecentlyViewed().filter((id) => id !== productId);
  writeRecentlyViewed([productId, ...current].slice(0, 8));
}
