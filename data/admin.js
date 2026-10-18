export const ADMIN_SESSION_KEY = "budybear-admin-session";
export const ADMIN_TOKEN = "bb-admin-demo";

export const DEMO_ADMIN = {
  id: "admin-1",
  email: "budybear2026@gmail.com",
  name: "Budy Bear",
  role: "admin",
  phone: "+92 333 0370236",
  title: "Budy Bear Operations",
};

export const ADMIN_LOGIN_EMAIL = DEMO_ADMIN.email;

export function adminLoginEmail() {
  return ADMIN_LOGIN_EMAIL;
}

/** Admin sign-in must use this exact lowercase address, not mixed case. */
export function isExactAdminLoginEmail(value) {
  return String(value || "").trim() === ADMIN_LOGIN_EMAIL;
}

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Dispatch",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];
