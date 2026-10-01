"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CUSTOMER_SESSION_KEY } from "@/data/store";
import {
  AUTH_CHANGED_EVENT,
  clearAuthSessions,
  emitAuthChanged,
  isAdminRole,
} from "@/lib/adminSession";

const CustomerAuthContext = createContext(null);

function readCustomerSession() {
  try {
    const raw = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
    if (!raw) return { user: null, accessToken: "" };
    const session = JSON.parse(raw);
    return {
      user: session.user || null,
      accessToken: session.accessToken || "",
    };
  } catch {
    return { user: null, accessToken: "" };
  }
}

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const session = readCustomerSession();
      setUser(session.user);
      setToken(session.accessToken);
      setIsReady(true);
    };
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, []);

  const persist = useCallback((session) => {
    if (!session) {
      clearAuthSessions();
      setUser(null);
      setToken("");
      emitAuthChanged();
      return;
    }
    window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
    setUser(session.user);
    setToken(session.accessToken);
    emitAuthChanged();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: data.error || "Invalid email or password." };
    }
    persist({ accessToken: data.accessToken, user: data.user });
    return { ok: true, user: data.user };
  }, [persist]);

  const register = useCallback(async (input) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: data.error || "Unable to create account." };
    }
    if (data.accessToken && data.user) {
      persist({ accessToken: data.accessToken, user: data.user });
    }
    return { ok: true, user: data.user, needsConfirm: !data.accessToken };
  }, [persist]);

  const logout = useCallback(() => persist(null), [persist]);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isReady,
      isAuthenticated: Boolean(user && token),
      isAdmin: isAdminRole(user?.role),
      authHeaders,
      login,
      register,
      logout,
    }),
    [user, token, isReady, authHeaders, login, register, logout]
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }
  return context;
}
