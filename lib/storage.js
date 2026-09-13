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

export function readCart() {
  return readStorage(CART_STORAGE_KEY, []);
}

export function writeCart(items) {
  writeStorage(CART_STORAGE_KEY, items);
}

export function readWishlist() {
  return readStorage(WISHLIST_STORAGE_KEY, []);
}

export function writeWishlist(ids) {
  writeStorage(WISHLIST_STORAGE_KEY, ids);
}

export function readLocalOrders() {
  return readStorage(ORDERS_STORAGE_KEY, []);
}

export function writeLocalOrders(orders) {
  writeStorage(ORDERS_STORAGE_KEY, orders);
}

export function saveLocalOrder(order) {
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
