const SCROLL_PREFIX = "kc-listing-scroll:";

let restoreListingScroll = false;
let suppressListingScrollSaveUntil = 0;

export function listingScrollStorageKey() {
  return `${SCROLL_PREFIX}${window.location.pathname}${window.location.search}`;
}

export function persistListingScroll() {
  if (typeof window === "undefined") return;
  if (Date.now() < suppressListingScrollSaveUntil) return;

  const y = window.scrollY;
  try {
    sessionStorage.setItem(listingScrollStorageKey(), String(y));
  } catch {
    // Private browsing can block sessionStorage.
  }

  const state = window.history.state;
  if (!state || typeof state !== "object" || state.kcListingScroll === y) return;
  window.history.replaceState({ ...state, kcListingScroll: y }, "");
}

export function readListingScroll() {
  if (typeof window === "undefined") return null;

  const fromHistory = window.history.state?.kcListingScroll;
  if (Number.isFinite(fromHistory) && fromHistory >= 0) return fromHistory;

  try {
    const stored = Number(sessionStorage.getItem(listingScrollStorageKey()));
    if (Number.isFinite(stored) && stored >= 0) return stored;
  } catch {
    // Ignore unavailable sessionStorage.
  }

  return null;
}

export function holdListingScrollRestore(ms = 600) {
  suppressListingScrollSaveUntil = Date.now() + ms;
}

export function shouldRestoreListingScroll() {
  return restoreListingScroll;
}

export function clearListingScrollRestore() {
  restoreListingScroll = false;
}

if (typeof window !== "undefined" && !window.__kcListingScrollListener) {
  window.__kcListingScrollListener = true;
  window.addEventListener("popstate", () => {
    restoreListingScroll = true;
  });
}
