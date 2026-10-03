"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "@/context/LoadingContext";

function RouteLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { beginNav, endNav } = useLoading();
  const first = useRef(true);

  useEffect(() => {
    const onPop = () => {
      if (window.location.pathname.startsWith("/admin")) beginNav();
    };

    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const link = event.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      const next = new URL(href, window.location.href);
      if (next.origin !== window.location.origin) return;
      if (`${next.pathname}${next.search}` === `${window.location.pathname}${window.location.search}`) {
        return;
      }
      if (!next.pathname.startsWith("/admin")) return;
      beginNav();
    };

    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
    };
  }, [beginNav]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = window.setTimeout(() => endNav(), 180);
    return () => window.clearTimeout(timer);
  }, [pathname, searchParams, endNav]);

  return null;
}

export default function RouteLoader() {
  return (
    <Suspense fallback={null}>
      <RouteLoaderInner />
    </Suspense>
  );
}
