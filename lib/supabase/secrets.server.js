function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

/** Server-only: read Supabase service role key from runtime env (not inlined for client). */
export function getServiceRoleKey() {
  if (typeof process === "undefined") return "";
  return clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
