import { ADMIN_SESSION_KEY, DEMO_ADMIN } from "@/data/admin";
import { CUSTOMER_SESSION_KEY } from "@/data/store";

export const AUTH_CHANGED_EVENT = "budybear-auth-changed";

/** Absolute admin session lifetime (also capped by JWT exp). */
export const ADMIN_SESSION_MAX_MS = 30 * 60 * 1000;
/** Sign out if the admin panel is idle this long. */
export const ADMIN_IDLE_MS = 15 * 60 * 1000;

export function isAdminRole(role) {
  return String(role || "").trim().toLowerCase() === "admin";
}

export function emitAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
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

function computeExpiresAt(accessToken, now = Date.now()) {
  const jwtExp = getAccessTokenExpiry(accessToken);
  const cap = now + ADMIN_SESSION_MAX_MS;
  if (jwtExp > 0) return Math.min(jwtExp, cap);
  return cap;
}

export function isAdminSessionFresh(session, now = Date.now()) {
  if (!session?.token) return false;
  const jwtExp = getAccessTokenExpiry(session.token);
  if (jwtExp > 0 && now >= jwtExp) return false;
  if (session.expiresAt && now >= Number(session.expiresAt)) return false;
  const lastActive = Number(session.lastActiveAt || session.issuedAt || 0);
  if (lastActive && now - lastActive >= ADMIN_IDLE_MS) return false;
  return true;
}

export function toAdminSession(user, accessToken) {
  if (!user || !accessToken || !isAdminRole(user.role)) return null;
  const now = Date.now();
  return {
    id: user.id,
    email: user.email,
    name: user.name || DEMO_ADMIN.name,
    role: "admin",
    phone: user.phone || DEMO_ADMIN.phone,
    title: user.title || DEMO_ADMIN.title,
    token: accessToken,
    issuedAt: now,
    lastActiveAt: now,
    expiresAt: computeExpiresAt(accessToken, now),
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
  return window.sessionStorage;
}

export function readAdminSession() {
  if (typeof window === "undefined") return null;

  try {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* ignore */
  }

  const stored = readJson(adminStorage(), ADMIN_SESSION_KEY);
  if (stored?.token && (isAdminRole(stored.role) || stored.role === DEMO_ADMIN.role)) {
    const session = {
      ...stored,
      role: isAdminRole(stored.role) ? "admin" : stored.role,
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
  try {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* ignore */
  }
  if (!session) {
    adminStorage().removeItem(ADMIN_SESSION_KEY);
    return;
  }
  const now = Date.now();
  const next = {
    ...session,
    issuedAt: session.issuedAt || now,
    lastActiveAt: session.lastActiveAt || now,
    expiresAt: session.expiresAt || computeExpiresAt(session.token, now),
  };
  adminStorage().setItem(ADMIN_SESSION_KEY, JSON.stringify(next));
}

export function touchAdminSession() {
  if (typeof window === "undefined") return readAdminSession();
  const session = readAdminSession();
  if (!session) return null;
  const next = { ...session, lastActiveAt: Date.now() };
  writeAdminSession(next);
  return next;
}

export function writeCustomerSessionFromAdmin(session) {
  if (typeof window === "undefined" || !session?.token) return;
  window.localStorage.setItem(
    CUSTOMER_SESSION_KEY,
    JSON.stringify({
      accessToken: session.token,
      user: {
        id: session.id,
        email: session.email,
        name: session.name,
        phone: session.phone,
        role: "admin",
      },
    })
  );
}

export function expireAdminSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function clearAuthSessions() {
  if (typeof window === "undefined") return;
  expireAdminSession();
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
}
