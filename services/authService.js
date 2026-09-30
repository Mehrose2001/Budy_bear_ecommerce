import { AppError, throwIf } from "@/lib/errors";
import { mapProfile } from "@/lib/mappers";
import { createServerClient, createUserClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loginWithPassword(email, password) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase is not configured.", 503);
  }
  const supabase = createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || "").trim(),
    password: String(password || ""),
  });
  if (error || !data?.session) {
    throw new AppError("Invalid email or password.", 401);
  }
  const profile = await loadProfile(data.session.access_token, data.user.id);
  return {
    accessToken: data.session.access_token,
    user: profile,
  };
}

export async function registerWithPassword(input) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Customer accounts need Supabase Auth to be configured.", 503);
  }
  if (!input.email || !input.password || !input.fullName) {
    throw new AppError("Name, email and password are required.", 400);
  }
  const supabase = createServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(input.email).trim(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        phone: input.phone || "",
      },
    },
  });
  throwIf(error, "Unable to create account.");
  if (!data.session) {
    return { user: null, accessToken: "", needsConfirm: true };
  }
  const profile = await loadProfile(data.session.access_token, data.user.id);
  return { user: profile, accessToken: data.session.access_token, needsConfirm: false };
}

export async function loadProfile(accessToken, userId) {
  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, address, city, role")
    .eq("id", userId)
    .maybeSingle();
  throwIf(error, "Unable to load account.", 500);
  return mapProfile(data);
}
