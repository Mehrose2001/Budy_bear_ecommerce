import { isSupabaseConfigured } from "@/lib/supabase/config";

function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

export function isMysqlConfigured() {
  const env = typeof process === "undefined" ? {} : process.env;
  return Boolean(clean(env.DB_HOST) && clean(env.DB_USER) && clean(env.DB_NAME));
}

export function useHostingerBackend() {
  const env = typeof process === "undefined" ? {} : process.env;
  return clean(env.USE_HOSTINGER_BACKEND).toLowerCase() === "true" && isMysqlConfigured();
}

export function isLiveBackendConfigured() {
  return useHostingerBackend() || isSupabaseConfigured();
}

export function liveBackendName() {
  if (useHostingerBackend()) return "hostinger_mysql";
  if (isSupabaseConfigured()) return "supabase";
  return "memory";
}
