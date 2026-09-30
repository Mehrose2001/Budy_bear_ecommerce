import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.dirname(fileURLToPath(new URL(".", import.meta.url)));
dotenv.config({ path: path.join(root, ".env") });

function requiredList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendOrigins: requiredList(process.env.FRONTEND_ORIGIN || "http://localhost:3000"),
  publicApiUrl: process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`,
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  adminBootstrap: {
    email: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@budybear.pk",
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD || "",
    name: process.env.ADMIN_BOOTSTRAP_NAME || "Budy Bear",
    phone: process.env.ADMIN_BOOTSTRAP_PHONE || "+92 333 0370236",
  },
  adminDevToken: process.env.ADMIN_DEV_TOKEN || "bb-admin-demo",
  ftp: {
    host: process.env.HOSTINGER_FTP_HOST || "",
    user: process.env.HOSTINGER_FTP_USER || "",
    password: process.env.HOSTINGER_FTP_PASSWORD || "",
    port: Number(process.env.HOSTINGER_FTP_PORT || 21),
    remoteDir: process.env.HOSTINGER_REMOTE_DIR || "/public_html/media",
    publicBaseUrl: (process.env.HOSTINGER_PUBLIC_BASE_URL || "").replace(/\/$/, ""),
  },
  catalogCacheMs: Number(process.env.CATALOG_CACHE_MS || 15000),
};

export function isSupabaseConfigured() {
  return Boolean(
    config.supabaseUrl &&
      config.supabaseAnonKey &&
      config.supabaseServiceRoleKey
  );
}

export function isFtpConfigured() {
  return Boolean(config.ftp.host && config.ftp.user && config.ftp.password);
}
