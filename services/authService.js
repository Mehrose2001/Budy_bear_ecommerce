import { adminLoginEmail } from "@/data/admin";
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

function normalizedEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function applyLoginEmail(service, userId, currentEmail, nextEmail) {
  if (!service) {
    throw new AppError("Login email changes need the server service role key.", 503);
  }

  const { data, error } = await service.auth.admin.updateUserById(userId, {
    email: nextEmail,
    email_confirm: true,
  });
  if (error) {
    throw new AppError(error.message || "Unable to update login email.", 400);
  }
  if (normalizedEmail(data?.user?.email) === nextEmail) return;

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: "email_change_new",
    email: currentEmail,
    newEmail: nextEmail,
  });
  if (linkError) {
    throw new AppError(linkError.message || "Unable to update login email.", 400);
  }

  const otp = linkData?.properties?.email_otp;
  const tokenHash = linkData?.properties?.hashed_token;
  const verifier = createServerClient();
  let verifyError = null;
  if (otp) {
    const result = await verifier.auth.verifyOtp({
      type: "email_change",
      email: nextEmail,
      token: String(otp),
    });
    verifyError = result.error;
  } else if (tokenHash) {
    const result = await verifier.auth.verifyOtp({
      type: "email_change",
      token_hash: String(tokenHash),
    });
    verifyError = result.error;
  } else {
    throw new AppError("Unable to confirm the new login email.", 400);
  }
  if (verifyError) {
    throw new AppError(verifyError.message || "Unable to confirm the new login email.", 400);
  }

  const { data: again } = await service.auth.admin.getUserById(userId);
  if (normalizedEmail(again?.user?.email) !== nextEmail) {
    throw new AppError("Unable to update the login email. Try a different email address.", 400);
  }
}

function isBootstrapAdminEmail(email) {
  return (
    String(email || "").trim().toLowerCase() ===
    String(process.env.ADMIN_BOOTSTRAP_EMAIL || "budybear2026@gmail.com").trim().toLowerCase()
  );
}

function fallbackUser(authUser, extra = {}) {
  return {
    id: authUser.id,
    email: normalizedEmail(authUser.email),
    name: extra.fullName || authUser.user_metadata?.full_name || "",
    phone: extra.phone || authUser.user_metadata?.phone || "",
    address: "",
    city: "",
    role: extra.role || (isBootstrapAdminEmail(authUser.email) ? "admin" : "customer"),
  };
}

async function persistCanonicalEmail(authUser, service) {
  const nextEmail = normalizedEmail(authUser.email);
  if (!authUser?.id || !nextEmail || !service) return nextEmail;
  if (String(authUser.email || "") !== nextEmail) {
    await service.auth.admin.updateUserById(authUser.id, {
      email: nextEmail,
      email_confirm: true,
    });
  }
  await service.from("profiles").update({ email: nextEmail }).eq("id", authUser.id);
  return nextEmail;
}

export async function ensureProfile(authUser, extra = {}) {
  const authEmail = normalizedEmail(authUser.email);
  const row = {
    id: authUser.id,
    email: authEmail,
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
    const mapped = mapProfile(existing.data) || fallbackUser(authUser, extra);
    const storedEmail = String(existing.data.email || "");
    if (authEmail && (String(authUser.email || "") !== authEmail || storedEmail !== authEmail)) {
      await persistCanonicalEmail(authUser, service);
    }
    return { ...mapped, email: authEmail || mapped.email };
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
    email: normalizedEmail(email),
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
    refreshToken: data.session.refresh_token,
    user: profile,
  };
}

export async function refreshWithToken(refreshToken) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Please sign in again.", 401);
  }
  const token = String(refreshToken || "").trim();
  if (!token) throw new AppError("Please sign in again.", 401);

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: token });
  if (error || !data?.session?.access_token || !data.session.refresh_token) {
    throw new AppError("Please sign in again.", 401);
  }

  const authUser = data.user || data.session.user;
  if (!authUser?.id) throw new AppError("Please sign in again.", 401);
  const profile = await loadProfile(data.session.access_token, authUser.id);
  if (String(profile?.role || "").toLowerCase() !== "admin") {
    throw new AppError("Please sign in again.", 401);
  }
  if (String(profile?.email || "").trim().toLowerCase() !== adminLoginEmail()) {
    throw new AppError("Please sign in again.", 401);
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
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

  const currentEmail = String(authUser.email || profile.email || "").trim().toLowerCase();
  const emailChanged = Boolean(nextEmail) && nextEmail !== currentEmail;
  if (emailChanged && nextEmail !== adminLoginEmail()) {
    throw new AppError(`Admin login is restricted to ${adminLoginEmail()}.`, 400);
  }
  const passwordChanged = Boolean(nextPassword);
  const changingLogin = emailChanged || passwordChanged;

  if (!changingLogin && (input.email != null || input.newPassword != null)) {
    throw new AppError("Change the login email or enter a new password.", 400);
  }

  if (changingLogin) {
    if (!currentPassword) {
      throw new AppError("Enter your current password to update email or password.", 400);
    }
    if (emailChanged && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      throw new AppError("Enter a valid login email.", 400);
    }
    if (passwordChanged) assertPassword(nextPassword);

    const verifier = createServerClient();
    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });
    if (verifyError) {
      throw new AppError("Current password is incorrect.", 400);
    }
  }

  let accessTokenOut = accessToken;
  let refreshTokenOut = "";
  if (changingLogin) {
    const service = createServiceClient();
    if (emailChanged) {
      await applyLoginEmail(service, authUser.id, currentEmail, nextEmail);
    }
    if (passwordChanged) {
      if (service) {
        const { error: updateError } = await service.auth.admin.updateUserById(authUser.id, {
          password: nextPassword,
        });
        if (updateError) {
          throw new AppError(updateError.message || "Unable to update password.", 400);
        }
      } else {
        const { data: updated, error: updateError } = await userClient.auth.updateUser({
          password: nextPassword,
        });
        if (updateError) {
          throw new AppError(updateError.message || "Unable to update password.", 400);
        }
        if (updated?.session?.access_token) {
          accessTokenOut = updated.session.access_token;
        }
      }
    }

    const verifier = createServerClient();
    const { data: nextAuth } = await verifier.auth.signInWithPassword({
      email: emailChanged ? nextEmail : currentEmail,
      password: passwordChanged ? nextPassword : currentPassword,
    });
    if (nextAuth?.session?.access_token) {
      accessTokenOut = nextAuth.session.access_token;
      refreshTokenOut = nextAuth.session.refresh_token || "";
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
    refreshToken: refreshTokenOut,
    user: {
      ...user,
      email: emailChanged ? nextEmail : user.email,
    },
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

  const supabase = createServerClient({ flowType: "implicit" });
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

export async function resetPasswordWithToken({ accessToken, tokenHash, code, token, email, password }) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Password reset needs email to be configured.", 503);
  }
  assertPassword(password);
  const nextPassword = String(password || "");
  const supabase = createServerClient({ flowType: "implicit" });
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
  } else if (token && email) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: "recovery",
      email: String(email).trim().toLowerCase(),
      token: String(token),
    });
    if (error || !data?.user) {
      throw new AppError("This reset link is invalid or has expired. Request a new one.", 400);
    }
    userId = data.user.id;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(String(code));
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
