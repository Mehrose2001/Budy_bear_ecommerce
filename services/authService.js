import { AppError, throwIf } from "@/lib/errors";
import { mapProfile } from "@/lib/mappers";
import { createServerClient, createServiceClient, createUserClient, getAuthUser } from "@/lib/supabase/server";
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

function isBootstrapAdminEmail(email) {
  return (
    String(email || "").trim().toLowerCase() ===
    String(process.env.ADMIN_BOOTSTRAP_EMAIL || "BudyBear2026@gmail.com").trim().toLowerCase()
  );
}

function fallbackUser(authUser, extra = {}) {
  return {
    id: authUser.id,
    email: authUser.email,
    name: extra.fullName || authUser.user_metadata?.full_name || "",
    phone: extra.phone || authUser.user_metadata?.phone || "",
    address: "",
    city: "",
    role: extra.role || (isBootstrapAdminEmail(authUser.email) ? "admin" : "customer"),
  };
}

export async function ensureProfile(authUser, extra = {}) {
  const row = {
    id: authUser.id,
    email: authUser.email,
    full_name: extra.fullName || authUser.user_metadata?.full_name || "Customer",
    phone: extra.phone || authUser.user_metadata?.phone || null,
    role: extra.role || (isBootstrapAdminEmail(authUser.email) ? "admin" : "customer"),
  };
  const service = createServiceClient();
  const db = service || createServerClient();
  const existing = await db
    .from("profiles")
    .select("id, email, full_name, phone, address, city, role")
    .eq("id", authUser.id)
    .maybeSingle();
  if (existing.data) {
    return mapProfile(existing.data) || fallbackUser(authUser, extra);
  }
  if (service) {
    const { error } = await service.from("profiles").upsert(row);
    if (!error) {
      const saved = await service
        .from("profiles")
        .select("id, email, full_name, phone, address, city, role")
        .eq("id", authUser.id)
        .maybeSingle();
      if (saved.data) return mapProfile(saved.data);
    }
  }
  return fallbackUser(authUser, extra);
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
  if (error || !data?.session || !data.user) {
    const message = String(error?.message || "");
    if (/session/i.test(message) && !/invalid/i.test(message)) {
      throw new AppError("Unable to start a login session. Try again.", 401);
    }
    throw new AppError("Invalid email or password.", 401);
  }
  const profile = await ensureProfile(data.user);
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
  assertPassword(input.password);
  const email = String(input.email).trim().toLowerCase();
  const fullName = String(input.fullName).trim();
  const phone = String(input.phone || "").trim();
  const service = createServiceClient();

  if (service) {
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });
    if (error) {
      const message = String(error.message || "");
      if (/already/i.test(message)) {
        throw new AppError("An account with this email already exists. Sign in instead.", 400);
      }
      throw new AppError(message || "Unable to create account.", 400);
    }
    const session = await createServerClient().auth.signInWithPassword({
      email,
      password: input.password,
    });
    if (session.error || !session.data?.session) {
      throw new AppError("Account created. Please sign in.", 400);
    }
    const profile = await ensureProfile(data.user, { fullName, phone, role: "customer" });
    return { user: profile, accessToken: session.data.session.access_token, needsConfirm: false };
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: { full_name: fullName, phone },
    },
  });
  throwIf(error, "Unable to create account.");
  if (!data.session || !data.user) {
    return { user: null, accessToken: "", needsConfirm: true };
  }
  const profile = await ensureProfile(data.user, { fullName, phone, role: "customer" });
  return { user: profile, accessToken: data.session.access_token, needsConfirm: false };
}

export async function loadProfile(accessToken, userId) {
  const service = createServiceClient();
  const db = service || createUserClient(accessToken) || createServerClient();
  const { data, error } = await db
    .from("profiles")
    .select("id, email, full_name, phone, address, city, role")
    .eq("id", userId)
    .maybeSingle();
  if (error && /session/i.test(String(error.message || ""))) {
    const authUser = { id: userId, email: "", user_metadata: {} };
    return fallbackUser(authUser);
  }
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

  const authUser = await getAuthUser(accessToken);
  if (!authUser) {
    throw new AppError("Please sign in.", 401);
  }
  const userClient = createUserClient(accessToken);

  const profile = await loadProfile(accessToken, authUser.id);
  if (String(profile?.role || "").toLowerCase() !== "admin") {
    throw new AppError("Admin access required.", 403);
  }

  const currentEmail = String(profile.email || authUser.email || "").trim().toLowerCase();
  const emailChanged = Boolean(nextEmail) && nextEmail !== currentEmail;
  const passwordChanged = Boolean(nextPassword);

  if (emailChanged && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    throw new AppError("Enter a valid login email.", 400);
  }

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
    if (emailChanged) {
      update.email = nextEmail;
      update.email_confirm = true;
    }
    if (passwordChanged) update.password = nextPassword;

    const service = createServiceClient();
    if (service) {
      const { error: updateError } = await service.auth.admin.updateUserById(authUser.id, update);
      if (updateError) {
        throw new AppError(updateError.message || "Unable to update login details.", 400);
      }
    } else {
      const { data: updated, error: updateError } = await userClient.auth.updateUser({
        email: update.email,
        password: update.password,
      });
      if (updateError) {
        throw new AppError(updateError.message || "Unable to update login details.", 400);
      }
      if (updated?.session?.access_token) {
        accessTokenOut = updated.session.access_token;
      }
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
      .eq("id", authUser.id);
    throwIf(profileError, "Unable to update profile.", 500);
  }

  const user = await loadProfile(accessTokenOut, authUser.id);
  return {
    accessToken: accessTokenOut,
    user,
    needsEmailConfirm: false,
  };
}

const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, we sent a password reset link. Check your inbox and spam folder.";

export async function requestPasswordReset(email, redirectTo, attemptKey = "unknown") {
  guardLogin(String(attemptKey || "unknown"));
  if (!isSupabaseConfigured()) {
    throw new AppError("Password reset needs email to be configured.", 503);
  }
  const address = String(email || "").trim().toLowerCase();
  if (!address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw new AppError("Enter a valid email address.", 400);
  }
  const target = String(redirectTo || "").trim();
  if (!/^https?:\/\//i.test(target)) {
    throw new AppError("Unable to send a reset link from this site address.", 400);
  }

  const supabase = createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(address, {
    redirectTo: target,
  });
  if (error) {
    const message = String(error.message || "");
    if (/rate|too many/i.test(message)) {
      throw new AppError("Too many reset emails. Try again in a minute.", 429);
    }
  }
  return { message: GENERIC_RESET_MESSAGE };
}

export async function resetPasswordWithToken({ accessToken, tokenHash, password }) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Password reset needs email to be configured.", 503);
  }
  assertPassword(password);
  const nextPassword = String(password || "");
  const supabase = createServerClient();
  let userId = "";

  if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: String(tokenHash),
    });
    if (error || !data?.user) {
      throw new AppError("This reset link is invalid or has expired. Request a new one.", 400);
    }
    userId = data.user.id;
  } else if (accessToken) {
    const authUser = await getAuthUser(accessToken);
    if (!authUser) {
      throw new AppError("This reset link is invalid or has expired. Request a new one.", 400);
    }
    userId = authUser.id;
  } else {
    throw new AppError("This reset link is invalid or has expired. Request a new one.", 400);
  }

  const service = createServiceClient();
  if (service) {
    const { error } = await service.auth.admin.updateUserById(userId, { password: nextPassword });
    if (error) throw new AppError(error.message || "Unable to update password.", 400);
  } else {
    const { error } = await createUserClient(accessToken).auth.updateUser({ password: nextPassword });
    if (error) throw new AppError(error.message || "Unable to update password.", 400);
  }

  return { message: "Your password has been updated. You can sign in now." };
}
