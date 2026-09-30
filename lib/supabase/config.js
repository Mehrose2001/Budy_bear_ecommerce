function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function readEnv(name) {
  const env = typeof process === "undefined" ? undefined : process.env;
  if (!env) return "";
  return clean(env[name]);
}

export function getServiceRoleKey() {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY");
}

const FALLBACK_SUPABASE_URL = "https://bdmihntpuyiuhtrkllil.supabase.co";

export function getSupabaseConfig() {
  const url =
    readEnv("SUPABASE_URL") ||
    readEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    FALLBACK_SUPABASE_URL;
  const anonKey =
    readEnv("SUPABASE_ANON_KEY") || readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, anonKey };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

export function getSupabaseEnvDebug() {
  return {
    hasSupabaseUrl: Boolean(readEnv("SUPABASE_URL")),
    hasPublicUrl: Boolean(readEnv("NEXT_PUBLIC_SUPABASE_URL")),
    hasSupabaseAnon: Boolean(readEnv("SUPABASE_ANON_KEY")),
    hasPublicAnon: Boolean(readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
  };
}
