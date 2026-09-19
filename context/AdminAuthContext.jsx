"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ADMIN_SESSION_KEY, ADMIN_TOKEN, DEMO_ADMIN } from "@/data/admin";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
      if (!raw) {
        setAdmin(null);
        setIsReady(true);
        return;
      }

      const session = JSON.parse(raw);
      const next = {
        ...session,
        name: DEMO_ADMIN.name,
        phone: DEMO_ADMIN.phone,
        email: session.email || DEMO_ADMIN.email,
        role: session.role || DEMO_ADMIN.role,
        title: session.title || DEMO_ADMIN.title,
      };
      window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(next));
      setAdmin(next);
    } catch {
      setAdmin(null);
    }
    setIsReady(true);
  }, []);

  const value = useMemo(() => {
    const login = (email, password) => {
      if (
        email.trim().toLowerCase() !== DEMO_ADMIN.email ||
        password !== DEMO_ADMIN.password
      ) {
        return { ok: false, error: "Invalid email or password." };
      }

      const session = {
        id: DEMO_ADMIN.id,
        email: DEMO_ADMIN.email,
        name: DEMO_ADMIN.name,
        role: DEMO_ADMIN.role,
        phone: DEMO_ADMIN.phone,
        title: DEMO_ADMIN.title,
        token: ADMIN_TOKEN,
      };
      window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      setAdmin(session);
      return { ok: true };
    };

    const updateProfile = (input) => {
      setAdmin((current) => {
        if (!current) return current;
        const next = { ...current, ...input };
        window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(next));
        return next;
      });
    };

    const logout = () => {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      setAdmin(null);
    };

    return { admin, isReady, isAuthenticated: Boolean(admin), login, logout, updateProfile };
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
