"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AUTH_CHANGED_EVENT,
  clearAuthSessions,
  emitAuthChanged,
  expireAdminSession,
  isAdminRole,
  isAdminSessionFresh,
  readAdminSession,
  toAdminSession,
  touchAdminSession,
  writeAdminSession,
} from "@/lib/adminSession";
import { adminFetch } from "@/lib/adminApi";

const AdminAuthContext = createContext(null);

async function verifyAdminSession(session) {
  if (!session?.token || !isAdminSessionFresh(session)) return null;
  try {
    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) {
      return isAdminSessionFresh(session) ? session : null;
    }
    const data = await response.json().catch(() => ({}));
    if (!isAdminRole(data.user?.role)) return null;
    return {
      ...session,
      id: data.user.id || session.id,
      email: data.user.email || session.email,
      name: data.user.name || session.name,
      phone: data.user.phone || session.phone,
      role: "admin",
    };
  } catch {
    return isAdminSessionFresh(session) ? session : null;
  }
}

export function AdminAuthProvider({ children }) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const onAdmin = window.location.pathname.startsWith("/admin");
      const nav = performance.getEntriesByType("navigation")[0];
      if (onAdmin && nav?.type === "reload") {
        expireAdminSession();
        if (!cancelled) {
          setAdmin(null);
          setIsReady(true);
        }
        return;
      }

      const verified = await verifyAdminSession(readAdminSession());
      if (cancelled) return;
      if (verified) {
        writeAdminSession(verified);
        setAdmin(verified);
      } else {
        expireAdminSession();
        setAdmin(null);
      }
      setIsReady(true);
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sync = () => {
      setAdmin(readAdminSession());
    };
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    const poll = () => {
      const session = readAdminSession();
      setAdmin((current) => {
        if (!session && !current) return current;
        if (!session) return null;
        return session;
      });
    };
    const id = window.setInterval(poll, 8000);

    const onActivity = () => {
      if (!pathname?.startsWith("/admin") || pathname === "/admin/login") return;
      touchAdminSession();
    };

    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("focus", onActivity);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("focus", onActivity);
    };
  }, [pathname]);

  const value = useMemo(() => {
    const login = async (email, password) => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: String(email || "").trim(),
            password,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { ok: false, error: data.error || "Invalid email or password." };
        }
        const session = toAdminSession(data.user, data.accessToken);
        if (!session) {
          return { ok: false, error: "This account is not an admin." };
        }
        writeAdminSession(session);
        setAdmin(session);
        emitAuthChanged();
        return { ok: true };
      } catch {
        return { ok: false, error: "Unable to sign in. Please try again." };
      }
    };

    const updateProfile = async (input) => {
      if (!admin?.token) return { ok: false, error: "Please sign in." };
      try {
        const data = await adminFetch(
          "/api/auth/me",
          {
            method: "PATCH",
            body: JSON.stringify({
              name: input.name,
              phone: input.phone,
            }),
          },
          admin.token
        );
        const next = {
          ...admin,
          name: data.user?.name ?? input.name,
          phone: data.user?.phone ?? input.phone,
          title: input.title ?? admin.title,
        };
        writeAdminSession(next);
        setAdmin(next);
        emitAuthChanged();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message || "Unable to update profile." };
      }
    };

    const updateCredentials = async (input) => {
      if (!admin?.token) return { ok: false, error: "Please sign in." };
      try {
        const data = await adminFetch(
          "/api/auth/me",
          {
            method: "PATCH",
            body: JSON.stringify({
              email: input.email,
              currentPassword: input.currentPassword,
              newPassword: input.newPassword,
            }),
          },
          admin.token
        );
        const session = toAdminSession(data.user, data.accessToken || admin.token);
        if (session) {
          writeAdminSession({ ...session, title: admin.title });
          setAdmin({ ...session, title: admin.title });
        }
        emitAuthChanged();
        return {
          ok: true,
          email: data.user?.email,
          message: data.needsEmailConfirm
            ? "Login details updated. Confirm the new email if you received a verification message."
            : "Login details updated.",
        };
      } catch (error) {
        return { ok: false, error: error.message || "Unable to update login details." };
      }
    };

    const logout = () => {
      clearAuthSessions();
      setAdmin(null);
      emitAuthChanged();
    };

    return {
      admin,
      isReady,
      isAuthenticated: Boolean(admin?.token) && isAdminSessionFresh(admin),
      login,
      logout,
      updateProfile,
      updateCredentials,
    };
  }, [admin, isReady]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
