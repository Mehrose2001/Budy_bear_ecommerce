"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ApiLoaderOverlay } from "@/components/ui/Loader";

const LoadingContext = createContext(null);
const MIN_VISIBLE_MS = 180;

function isAdminPath() {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/admin");
}

function isApiRequest(input, init) {
  const url = typeof input === "string" ? input : input?.url || "";
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) return false;
    if (!parsed.pathname.startsWith("/api/")) return false;
    const method = String(init?.method || input?.method || "GET").toUpperCase();
    if (method === "GET" && parsed.pathname.startsWith("/api/wishlist")) return false;
    if (method === "GET" && parsed.pathname === "/api/health") return false;
    if (method === "PATCH" && parsed.pathname.startsWith("/api/admin/orders")) return false;
    return true;
  } catch {
    return String(url).includes("/api/");
  }
}

export function LoadingProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const apiCount = useRef(0);
  const navCount = useRef(0);
  const shownAt = useRef(0);
  const hideTimer = useRef(null);

  const sync = useCallback(() => {
    const busy = apiCount.current + navCount.current > 0;
    if (busy) {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      if (!shownAt.current) shownAt.current = Date.now();
      setVisible(true);
      return;
    }

    const elapsed = shownAt.current ? Date.now() - shownAt.current : MIN_VISIBLE_MS;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    hideTimer.current = setTimeout(() => {
      shownAt.current = 0;
      hideTimer.current = null;
      setVisible(false);
    }, wait);
  }, []);

  const beginApi = useCallback(() => {
    if (!isAdminPath()) return;
    apiCount.current += 1;
    sync();
  }, [sync]);

  const endApi = useCallback(() => {
    if (!isAdminPath() && apiCount.current === 0) return;
    apiCount.current = Math.max(0, apiCount.current - 1);
    sync();
  }, [sync]);

  const beginNav = useCallback(() => {
    if (!isAdminPath()) return;
    navCount.current = 1;
    sync();
  }, [sync]);

  const endNav = useCallback(() => {
    navCount.current = 0;
    sync();
  }, [sync]);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const track = isApiRequest(input, init);
      if (track) beginApi();
      try {
        return await originalFetch(input, init);
      } finally {
        if (track) endApi();
      }
    };
    return () => {
      window.fetch = originalFetch;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [beginApi, endApi]);

  const value = useMemo(
    () => ({ beginApi, endApi, beginNav, endNav, visible }),
    [beginApi, endApi, beginNav, endNav, visible]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {visible ? <ApiLoaderOverlay /> : null}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
}
