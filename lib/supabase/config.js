function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

export function getSupabaseConfig() {
  return {
    url: clean(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    ),
    anonKey: clean(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    ),
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}
