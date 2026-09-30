function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function first(...values) {
  for (const value of values) {
    const next = clean(value);
    if (next) return next;
  }
  return "";
}

export function getSupabaseConfig() {
  return {
    url: first(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: first(
      process.env.SUPABASE_ANON_KEY,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}
