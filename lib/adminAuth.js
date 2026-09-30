import { ADMIN_TOKEN } from "@/data/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBearerToken, getRequestUser } from "@/lib/supabase/server";

export async function isAdminRequest(request) {
  if (isSupabaseConfigured()) {
    const user = await getRequestUser(request);
    return user?.role === "admin";
  }
  const token = getBearerToken(request);
  return token === ADMIN_TOKEN;
}

export function getAccessToken(request) {
  return getBearerToken(request);
}
