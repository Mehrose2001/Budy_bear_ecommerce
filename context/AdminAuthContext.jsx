"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { DEMO_ADMIN } from "@/data/admin";
import {
  AUTH_CHANGED_EVENT,
  clearAuthSessions,
  emitAuthChanged,
  isAdminRole,
  readAdminSession,
  toAdminSession,
  writeAdminSession,
  writeCustomerSessionFromAdmin,
} from "@/lib/adminSession";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAdmin(readAdminSession());
      setIsReady(true);
    };
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, [pathname]);

  const value = useMemo(() => {
    const login = async (email, password) => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { ok: false, error: data.error || "Invalid email or password." };
        }
        if (!isAdminRole(data.user?.role)) {
          return { ok: false, error: "This account is not an admin." };
        }

        const session = toAdminSession(data.user, data.accessToken) || {
          id: data.user?.id || DEMO_ADMIN.id,
          email: data.user?.email || email,
          name: data.user?.name || DEMO_ADMIN.name,
          role: "admin",
          phone: data.user?.phone || DEMO_ADMIN.phone,
          title: DEMO_ADMIN.title,
          token: data.accessToken,
        };
        writeAdminSession(session);
        writeCustomerSessionFromAdmin(session);
        setAdmin(session);
        emitAuthChanged();
        return { ok: true };
      } catch {
        return { ok: false, error: "Unable to sign in. Please try again." };
      }
    };

    const updateProfile = (input) => {
      setAdmin((current) => {
        if (!current) return current;
        const next = { ...current, ...input };
        writeAdminSession(next);
        writeCustomerSessionFromAdmin(next);
        return next;
      });
      emitAuthChanged();
    };

    const logout = () => {
      clearAuthSessions();
      setAdmin(null);
      emitAuthChanged();
    };

    return { admin, isReady, isAuthenticated: Boolean(admin?.token), login, logout, updateProfile };
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
