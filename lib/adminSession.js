import { ADMIN_SESSION_KEY, adminLoginEmail } from "@/data/admin";
import { CUSTOMER_SESSION_KEY } from "@/data/store";

export const AUTH_CHANGED_EVENT = "budybear-auth-changed";
export const ORDERS_CHANGED_EVENT = "budybear-orders-changed";

/** Sign-in is required again after this, even while the admin is active. */
export const ADMIN_SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000;
/** Sign out when the admin panel has had no activity for this long. */
export const ADMIN_IDLE_MS = 8 * 60 * 60 * 1000;
/** Renew the access token this long before it expires. */
export const ADMIN_RENEW_SKEW_MS = 2 * 60 * 1000;
const REFRESH_LOCK_KEY = `${ADMIN_SESSION_KEY}:refresh`;

export function isAdminRole(role) {
  return String(role || "").trim().toLowerCase() === "admin";
}

export function emitAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function isAccessTokenFresh(token, now = Date.now()) {
  const raw = String(token || "");
  if (!raw) return false;
  const jwtExp = getAccessTokenExpiry(raw);
  if (jwtExp > 0 && now >= jwtExp - 10_000) return false;
  return true;
}

export function getAccessTokenExpiry(token) {
  const raw = String(token || "");
  const parts = raw.split(".");
  if (parts.length < 2) return 0;
  try {
    const json = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (json?.exp) return Number(json.exp) * 1000;
  } catch {
    return 0;
  }
  return 0;
}

export function accessTokenNeedsRenewal(token, now = Date.now(), skew = ADMIN_RENEW_SKEW_MS) {
  const jwtExp = getAccessTokenExpiry(token);
  if (!jwtExp) return false;
  return now >= jwtExp - skew;
}

export function isAdminSessionFresh(session, now = Date.now()) {
  if (!session?.token) return false;
  if (session.expiresAt && now >= Number(session.expiresAt)) return false;
  const lastActive = Number(session.lastActiveAt || session.issuedAt || 0);
  if (lastActive && now - lastActive >= ADMIN_IDLE_MS) return false;
  const jwtExp = getAccessTokenExpiry(session.token);
  if (jwtExp > 0 && now >= jwtExp && !session.refreshToken) return false;
  return true;
}

export function toAdminSession(user, accessToken, refreshToken = "") {
  if (!user || !accessToken || !isAdminRole(user.role)) return null;
  if (String(user.email || "").trim().toLowerCase() !== adminLoginEmail()) return null;
  const now = Date.now();
  return {
    id: user.id,
    email: String(user.email || "").trim().toLowerCase(),
    name: user.name || "",
    role: "admin",
    phone: user.phone || "",
    title: user.title || "",
    token: accessToken,
    refreshToken: String(refreshToken || ""),
    issuedAt: now,
    lastActiveAt: now,
    expiresAt: now + ADMIN_SESSION_MAX_MS,
    sessionVersion: 1,
  };
}

function readJson(storage, key) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function adminStorage() {
  return window.localStorage;
}

function migrateLegacySession() {
  try {
    const legacy = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (legacy && !window.localStorage.getItem(ADMIN_SESSION_KEY)) {
      window.localStorage.setItem(ADMIN_SESSION_KEY, legacy);
    }
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function readAdminSession() {
  if (typeof window === "undefined") return null;
  migrateLegacySession();

  const stored = readJson(adminStorage(), ADMIN_SESSION_KEY);
  if (stored?.token && isAdminRole(stored.role)) {
    const session = {
      ...stored,
      role: "admin",
      email: String(stored.email || "").trim().toLowerCase(),
    };
    if (!isAdminSessionFresh(session)) {
      expireAdminSession();
      return null;
    }
    return session;
  }

  return null;
}

export function writeAdminSession(session) {
  if (typeof window === "undefined") return;
  if (!session) {
    adminStorage().removeItem(ADMIN_SESSION_KEY);
    return;
  }
  const now = Date.now();
  const next = {
    ...session,
    refreshToken: String(session.refreshToken || ""),
    issuedAt: session.issuedAt || now,
    lastActiveAt: session.lastActiveAt || now,
    expiresAt: session.expiresAt || (session.issuedAt || now) + ADMIN_SESSION_MAX_MS,
    sessionVersion: Number(session.sessionVersion || 0) || 1,
  };
  adminStorage().setItem(ADMIN_SESSION_KEY, JSON.stringify(next));
}

export function touchAdminSession() {
  if (typeof window === "undefined") return readAdminSession();
  migrateLegacySession();
  const stored = readJson(adminStorage(), ADMIN_SESSION_KEY);
  if (!stored?.token || !isAdminSessionFresh(stored)) return readAdminSession();
  stored.lastActiveAt = Date.now();
  adminStorage().setItem(ADMIN_SESSION_KEY, JSON.stringify(stored));
  return stored;
}

let refreshInflight = null;

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function refreshAdminSession() {
  if (typeof window === "undefined") return null;
  if (refreshInflight) return refreshInflight;
  refreshInflight = renewAdminAccessToken().finally(() => {
    refreshInflight = null;
  });
  return refreshInflight;
}

async function renewAdminAccessToken() {
  let session = readAdminSession();
  if (!session?.refreshToken) return session;
  if (!accessTokenNeedsRenewal(session.token)) return session;

  const lockUntil = Number(String(window.localStorage.getItem(REFRESH_LOCK_KEY) || "").split(":")[0]);
  if (lockUntil > Date.now()) {
    await sleep(800);
    session = readAdminSession();
    if (!session?.refreshToken || !accessTokenNeedsRenewal(session.token)) return session;
  }

  const owner = Math.random().toString(36).slice(2);
  window.localStorage.setItem(REFRESH_LOCK_KEY, `${Date.now() + 10_000}:${owner}`);
  await sleep(40);
  if (!String(window.localStorage.getItem(REFRESH_LOCK_KEY) || "").endsWith(owner)) {
    await sleep(800);
    return readAdminSession();
  }

  session = readAdminSession() || session;
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.accessToken || !data.refreshToken) {
      if (response.status === 401 || response.status === 403) {
        expireAdminSession();
        emitAuthChanged();
        return null;
      }
      return readAdminSession();
    }

    const latest = readJson(adminStorage(), ADMIN_SESSION_KEY) || session;
    const next = {
      ...latest,
      token: data.accessToken,
      refreshToken: data.refreshToken,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
      lastActiveAt: latest.lastActiveAt || session.lastActiveAt,
      sessionVersion: Number(latest.sessionVersion || session.sessionVersion || 1) + 1,
    };
    if (data.user && isAdminRole(data.user.role)) {
      next.name = data.user.name || next.name;
      next.phone = data.user.phone || next.phone;
      next.email = String(data.user.email || next.email).trim().toLowerCase();
    }
    writeAdminSession(next);
    emitAuthChanged();
    return next;
  } catch {
    return readAdminSession();
  } finally {
    if (String(window.localStorage.getItem(REFRESH_LOCK_KEY) || "").endsWith(owner)) {
      window.localStorage.removeItem(REFRESH_LOCK_KEY);
    }
  }
}

export function expireAdminSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    window.localStorage.removeItem(REFRESH_LOCK_KEY);
  } catch {
    /* ignore */
  }
}

export function expireCustomerSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function readCustomerAccessToken() {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
    if (!raw) return "";
    const session = JSON.parse(raw);
    const token = String(session.accessToken || "");
    return token && isAccessTokenFresh(token) ? token : "";
  } catch {
    return "";
  }
}

export function customerAuthHeaders(token = readCustomerAccessToken()) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function emitOrdersChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
}

export function clearAuthSessions() {
  if (typeof window === "undefined") return;
  expireAdminSession();
  expireCustomerSession();
}
