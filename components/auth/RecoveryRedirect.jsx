"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function RecoveryRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/reset-password" || pathname === "/admin/reset-password") return;

    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const type = hash.get("type") || search.get("type");
    const hasRecovery =
      type === "recovery" ||
      Boolean(search.get("token_hash") || hash.get("token_hash") || hash.get("access_token"));
    if (!hasRecovery) return;

    const target = pathname?.startsWith("/admin") ? "/admin/reset-password" : "/reset-password";
    window.location.replace(`${target}${window.location.search}${window.location.hash}`);
  }, [pathname]);

  return null;
}
