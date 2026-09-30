function readEnv(...keys) {
  for (const key of keys) {
    const value = String(process.env[key] || "").trim();
    if (value) return value;
  }
  return "";
}

const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
const supabaseAnonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");

export function getSupabaseConfig() {
  return {
    url: supabaseUrl || "",
    anonKey: supabaseAnonKey || "",
  };
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
