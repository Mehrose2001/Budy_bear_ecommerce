import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

let browserClient;

export function createBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  if (typeof window === "undefined") return createServerAnonClient();
  if (!browserClient) {
    const { url, anonKey } = getSupabaseConfig();
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}

function createServerAnonClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
