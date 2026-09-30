export { isSupabaseConfigured } from "@/lib/supabase/config";
export { createBrowserClient } from "@/lib/supabase/client";
export { createServerClient, createUserClient, getRequestUser } from "@/lib/supabase/server";

export async function createSupabaseClient(accessToken) {
  const { createUserClient, createServerClient } = await import("@/lib/supabase/server");
  if (accessToken) return createUserClient(accessToken);
  return createServerClient();
}
