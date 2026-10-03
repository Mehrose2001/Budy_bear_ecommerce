import { AppError, throwIf } from "@/lib/errors";
import { mapProfile } from "@/lib/mappers";
import { createServerClient, createServiceClient, createUserClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const loginAttempts = new Map();

function guardLogin(key) {
  const now = Date.now();
  const entry = loginAttempts.get(key) || { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60_000;
  }
  entry.count += 1;
  loginAttempts.set(key, entry);
  if (entry.count > 8) {
    throw new AppError("Too many login attempts. Try again in a minute.", 429);
  }
}

function assertPassword(password) {
  if (String(password || "").length < 8) {
    throw new AppError("Password must be at least 8 characters.", 400);
  }
}

export async function loginWithPassword(email, password, attemptKey = "unknown") {
  guardLogin(String(attemptKey || "unknown"));
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase is not configured.", 503);
  }
  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
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

export async function updateAdminAccount(accessToken, input = {}) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Account updates need Supabase Auth.", 503);
  }
  if (!accessToken) {
    throw new AppError("Please sign in.", 401);
  }

  const currentPassword = String(input.currentPassword || "");
  const nextEmail = String(input.email || "").trim().toLowerCase();
  const nextPassword = String(input.newPassword || "");
  const nextName = input.name == null ? null : String(input.name).trim();
  const nextPhone = input.phone == null ? null : String(input.phone).trim();

  const userClient = createUserClient(accessToken);
  const { data: authData, error: authError } = await userClient.auth.getUser(accessToken);
  if (authError || !authData?.user) {
    throw new AppError("Please sign in.", 401);
  }

  const profile = await loadProfile(accessToken, authData.user.id);
  if (String(profile?.role || "").toLowerCase() !== "admin") {
    throw new AppError("Admin access required.", 403);
  }

  const currentEmail = String(profile.email || authData.user.email || "").trim().toLowerCase();
  const emailChanged = Boolean(nextEmail) && nextEmail !== currentEmail;
  const passwordChanged = Boolean(nextPassword);

  if (emailChanged || passwordChanged) {
    if (!currentPassword) {
      throw new AppError("Enter your current password to change email or password.", 400);
    }
    if (passwordChanged) assertPassword(nextPassword);

    const verifier = createServerClient();
    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });
    if (verifyError) {
      throw new AppError("Current password is incorrect.", 401);
    }
  }

  let accessTokenOut = accessToken;
  if (emailChanged || passwordChanged) {
    const update = {};
    if (emailChanged) update.email = nextEmail;
    if (passwordChanged) update.password = nextPassword;
    const { data: updated, error: updateError } = await userClient.auth.updateUser(update);
    if (updateError) {
      throw new AppError(updateError.message || "Unable to update login details.", 400);
    }
    if (updated?.session?.access_token) {
      accessTokenOut = updated.session.access_token;
    }
  }

  const profilePatch = {};
  if (nextName != null) profilePatch.full_name = nextName;
  if (nextPhone != null) profilePatch.phone = nextPhone || null;
  if (emailChanged) profilePatch.email = nextEmail;

  if (Object.keys(profilePatch).length) {
    const writer = createServiceClient() || userClient;
    const { error: profileError } = await writer
      .from("profiles")
      .update(profilePatch)
      .eq("id", authData.user.id);
    throwIf(profileError, "Unable to update profile.", 500);
  }

  const user = await loadProfile(accessTokenOut, authData.user.id);
  return {
    accessToken: accessTokenOut,
    user,
    needsEmailConfirm: emailChanged,
  };
}
