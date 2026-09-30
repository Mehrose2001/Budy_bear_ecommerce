import { ADMIN_SESSION_KEY, DEMO_ADMIN } from "@/data/admin";
import { CUSTOMER_SESSION_KEY } from "@/data/store";

export const AUTH_CHANGED_EVENT = "budybear-auth-changed";

export function isAdminRole(role) {
  return String(role || "").trim().toLowerCase() === "admin";
}

export function emitAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function toAdminSession(user, accessToken) {
  if (!user || !accessToken || !isAdminRole(user.role)) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name || DEMO_ADMIN.name,
    role: "admin",
    phone: user.phone || DEMO_ADMIN.phone,
    title: user.title || DEMO_ADMIN.title,
    token: accessToken,
  };
}

function readJson(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readAdminSession() {
  if (typeof window === "undefined") return null;

  const stored = readJson(ADMIN_SESSION_KEY);
  if (stored?.token && (isAdminRole(stored.role) || stored.role === DEMO_ADMIN.role)) {
    return {
      ...stored,
      role: isAdminRole(stored.role) ? "admin" : stored.role,
    };
  }

  const customer = readJson(CUSTOMER_SESSION_KEY);
  return toAdminSession(customer?.user, customer?.accessToken);
}

export function writeAdminSession(session) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    return;
  }
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
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

export function clearAuthSessions() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
}
