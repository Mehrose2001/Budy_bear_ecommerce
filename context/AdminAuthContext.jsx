"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AUTH_CHANGED_EVENT,
  clearAuthSessions,
  emitAuthChanged,
  expireAdminSession,
  isAdminRole,
  accessTokenNeedsRenewal,
  isAdminSessionFresh,
  readAdminSession,
  refreshAdminSession,
  toAdminSession,
  touchAdminSession,
  writeAdminSession,
} from "@/lib/adminSession";
import { ADMIN_SESSION_KEY } from "@/data/admin";
import { adminFetch } from "@/lib/adminApi";

const AdminAuthContext = createContext(null);

async function verifyAdminSession(session) {
  if (!session?.token || !isAdminSessionFresh(session)) return null;
  let current = session;
  if (current.refreshToken && accessTokenNeedsRenewal(current.token, Date.now(), 60_000)) {
    current = await refreshAdminSession();
    if (!current?.token || !isAdminSessionFresh(current)) return null;
  }
  try {
    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${current.token}` },
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) {
      return isAdminSessionFresh(current) ? current : null;
    }
    const data = await response.json().catch(() => ({}));
    if (!isAdminRole(data.user?.role)) return null;
    return {
      ...current,
      id: data.user.id || current.id,
      email: String(data.user.email || current.email || "").trim().toLowerCase(),
      name: data.user.name || current.name,
      phone: data.user.phone || current.phone,
      role: "admin",
    };
  } catch {
    return isAdminSessionFresh(current) ? current : null;
  }
}

export function AdminAuthProvider({ children }) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
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
    const onStorage = (event) => {
      if (event.key !== ADMIN_SESSION_KEY) return;
      sync();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const poll = () => {
      const session = readAdminSession();
      if (session?.refreshToken && accessTokenNeedsRenewal(session.token)) {
        refreshAdminSession().then((next) => {
          setAdmin(next && isAdminSessionFresh(next) ? next : null);
        });
        return;
      }
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
            audience: "admin",
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { ok: false, error: data.error || "Invalid email or password." };
        }
        const session = toAdminSession(data.user, data.accessToken, data.refreshToken);
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
        const session = toAdminSession(
          data.user,
          data.accessToken || admin.token,
          data.refreshToken || admin.refreshToken
        );
        if (session) {
          writeAdminSession({ ...session, title: admin.title });
          setAdmin({ ...session, title: admin.title });
        }
        emitAuthChanged();
        return {
          ok: true,
          email: data.user?.email || input.email,
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
