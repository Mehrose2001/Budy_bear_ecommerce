function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function looksLikeServiceRoleJwt(value) {
  const parts = value.split(".");
  if (parts.length !== 3 || parts[2].length < 43) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}

/** Server-only: read Supabase service role key from runtime env (not inlined for client). */
export function getServiceRoleKey() {
  if (typeof process === "undefined") return "";
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key) return "";
  if (!looksLikeServiceRoleJwt(key)) return "";
  return key;
}
