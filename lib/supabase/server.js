import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

export function createServerClient() {
  if (!isSupabaseConfigured()) return null;
  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createUserClient(accessToken) {
  if (!isSupabaseConfigured()) return null;
  const { url, anonKey } = getSupabaseConfig();
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers },
  });
}

export function getBearerToken(request) {
  const header = request?.headers?.get?.("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return "";
}

export async function getRequestUser(request) {
  const token = getBearerToken(request);
  if (!token) return null;
  const supabase = createUserClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, address, city, role")
    .eq("id", data.user.id)
    .maybeSingle();
  return {
    id: data.user.id,
    email: profile?.email || data.user.email,
    name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    role: profile?.role || "customer",
    accessToken: token,
  };
}
