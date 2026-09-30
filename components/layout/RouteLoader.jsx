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
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState = (...args) => {
      beginNav();
      return origPush(...args);
    };
    history.replaceState = (...args) => {
      beginNav();
      return origReplace(...args);
    };

    const onPop = () => beginNav();
    window.addEventListener("popstate", onPop);

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
      beginNav();
    };

    document.addEventListener("click", onClick);
    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick);
    };
  }, [beginNav]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = window.setTimeout(() => endNav(), 350);
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
