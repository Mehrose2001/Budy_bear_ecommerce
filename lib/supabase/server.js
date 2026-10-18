import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseConfig,
  getServiceRoleKey,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { isAccessTokenFresh } from "@/lib/adminSession";

export function createServerClient(options = {}) {
  if (!isSupabaseConfigured()) return null;
  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      ...(options.flowType ? { flowType: options.flowType } : {}),
    },
  });
}

export function createServiceClient() {
  if (!isSupabaseConfigured()) return null;
  const serviceKey = getServiceRoleKey();
  if (!serviceKey) return null;
  const { url } = getSupabaseConfig();
  return createClient(url, serviceKey, {
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

export async function getAuthUser(accessToken) {
  const token = String(accessToken || "").trim();
  if (!token || !isAccessTokenFresh(token)) return null;
  const authClient = createServerClient();
  if (!authClient) return null;
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function getRequestUser(request) {
  const token = getBearerToken(request);
  if (!token) return null;
  try {
    const authUser = await getAuthUser(token);
    if (!authUser) return null;
    const db = createServiceClient() || createUserClient(token);
    const { data: profile } = await db
      .from("profiles")
      .select("id, email, full_name, phone, address, city, role")
      .eq("id", authUser.id)
      .maybeSingle();
    const email = String(profile?.email || authUser.email || "").trim().toLowerCase();
    if (email && (String(profile?.email || "") !== email || String(authUser.email || "") !== email)) {
      const service = createServiceClient();
      if (service) {
        if (String(authUser.email || "") !== email) {
          await service.auth.admin.updateUserById(authUser.id, {
            email,
            email_confirm: true,
          });
        }
        if (String(profile?.email || "") !== email) {
          await service.from("profiles").update({ email }).eq("id", authUser.id);
        }
      }
    }
    return {
      id: authUser.id,
      email,
      name: profile?.full_name || authUser.user_metadata?.full_name || "",
      phone: profile?.phone || authUser.user_metadata?.phone || "",
      address: profile?.address || "",
      city: profile?.city || "",
      role: profile?.role || "customer",
      accessToken: token,
    };
  } catch {
    return null;
  }
}
