import { ADMIN_TOKEN } from "@/data/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBearerToken, getRequestUser } from "@/lib/supabase/server";

export async function isAdminRequest(request) {
  const token = getBearerToken(request);
  if (!token) return false;

  if (isSupabaseConfigured()) {
    if (token === ADMIN_TOKEN) return false;
    const user = await getRequestUser(request);
    return user?.role === "admin";
  }

  if (process.env.NODE_ENV === "production") return false;
  return token === ADMIN_TOKEN;
}

export function getAccessToken(request) {
  return getBearerToken(request);
}
