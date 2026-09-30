import { createClient } from "@supabase/supabase-js";
import { config, isSupabaseConfigured } from "./config.js";

let serviceClient;
let anonClient;

export function getServiceClient() {
  if (!isSupabaseConfigured()) return null;
  if (!serviceClient) {
    serviceClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}

export function getAnonClient() {
  if (!isSupabaseConfigured()) return null;
  if (!anonClient) {
    anonClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anonClient;
}

export async function requireSupabase() {
  const client = getServiceClient();
  if (!client) {
    const error = new Error("Supabase is not configured on the API.");
    error.status = 503;
    throw error;
  }
  return client;
}
