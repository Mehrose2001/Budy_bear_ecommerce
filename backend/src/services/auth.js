import { config, isSupabaseConfigured } from "../config.js";
import { HttpError } from "../lib/http.js";
import { mapProfile } from "../lib/map.js";
import { getAnonClient, getRecoverClient, getServiceClient } from "../supabase.js";

const loginAttempts = new Map();

function guardLogin(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60_000;
  }
  entry.count += 1;
  loginAttempts.set(ip, entry);
  if (entry.count > 12) {
    throw new HttpError(429, "Too many login attempts. Try again in a minute.");
  }
}

function normalizedEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function applyLoginEmail(userId, currentEmail, nextEmail) {
  const service = getServiceClient();
  if (!service) {
    throw new HttpError(503, "Login email changes need the server service role key.");
  }
  const { data, error } = await service.auth.admin.updateUserById(userId, {
    email: nextEmail,
    email_confirm: true,
  });
  if (error) throw new HttpError(400, error.message || "Unable to update login email.");
  if (normalizedEmail(data?.user?.email) === nextEmail) return;

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: "email_change_new",
    email: currentEmail,
    newEmail: nextEmail,
  });
  if (linkError) throw new HttpError(400, linkError.message || "Unable to update login email.");

  const otp = linkData?.properties?.email_otp;
  const tokenHash = linkData?.properties?.hashed_token;
  const recover = getRecoverClient();
  let verifyError = null;
  if (otp) {
    const result = await recover.auth.verifyOtp({
      type: "email_change",
      email: nextEmail,
      token: String(otp),
    });
    verifyError = result.error;
  } else if (tokenHash) {
    const result = await recover.auth.verifyOtp({
      type: "email_change",
      token_hash: String(tokenHash),
    });
    verifyError = result.error;
  } else {
    throw new HttpError(400, "Unable to confirm the new login email.");
  }
  if (verifyError) throw new HttpError(400, verifyError.message || "Unable to confirm the new login email.");

  const { data: again } = await service.auth.admin.getUserById(userId);
  if (normalizedEmail(again?.user?.email) !== nextEmail) {
    throw new HttpError(400, "Unable to update the login email. Try a different email address.");
  }
}

async function loadProfile(userId) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new HttpError(500, "Unable to load account.");
  if (!data) {
    return {
      id: userId,
      email: "",
      name: "",
      phone: "",
      role: "customer",
    };
  }
  return mapProfile(data);
}

const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, we sent a password reset link. Check your inbox and spam folder.";

export async function requestPasswordReset(email, redirectTo, ip) {
  guardLogin(ip || "unknown");
  const address = String(email || "").trim().toLowerCase();
  if (!address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw new HttpError(400, "Enter a valid email address.");
  }
  if (!isSupabaseConfigured()) {
    throw new HttpError(503, "Password reset needs email to be configured.");
  }
  const { error } = await getRecoverClient().auth.resetPasswordForEmail(address, {
    redirectTo,
  });
  if (error && /rate|too many/i.test(String(error.message || ""))) {
    throw new HttpError(429, "Too many reset emails. Try again in a minute.");
  }
  return { message: GENERIC_RESET_MESSAGE };
}

export async function resetPasswordWithToken({ accessToken, tokenHash, code, token, email, password }) {
  if (!isSupabaseConfigured()) {
    throw new HttpError(503, "Password reset needs email to be configured.");
  }
  if (String(password || "").length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters.");
  }

  const recover = getRecoverClient();
  let userId = "";
  if (tokenHash) {
    const { data, error } = await recover.auth.verifyOtp({
      type: "recovery",
      token_hash: String(tokenHash),
    });
    if (error || !data?.user) {
      throw new HttpError(400, "This reset link is invalid or has expired. Request a new one.");
    }
    userId = data.user.id;
  } else if (token && email) {
    const { data, error } = await recover.auth.verifyOtp({
      type: "recovery",
      email: String(email).trim().toLowerCase(),
      token: String(token),
    });
    if (error || !data?.user) {
      throw new HttpError(400, "This reset link is invalid or has expired. Request a new one.");
    }
    userId = data.user.id;
  } else if (code) {
    const { data, error } = await recover.auth.exchangeCodeForSession(String(code));
    if (error || !data?.user) {
      throw new HttpError(400, "This reset link is invalid or has expired. Request a new one.");
    }
    userId = data.user.id;
  } else if (accessToken) {
    const { data, error } = await getAnonClient().auth.getUser(accessToken);
    if (error || !data?.user) {
      throw new HttpError(400, "This reset link is invalid or has expired. Request a new one.");
    }
    userId = data.user.id;
  } else {
    throw new HttpError(400, "This reset link is invalid or has expired. Request a new one.");
  }

  const { error } = await getServiceClient().auth.admin.updateUserById(userId, { password });
  if (error) throw new HttpError(400, error.message || "Unable to update password.");
  return { message: "Your password has been updated. You can sign in now." };
}

export async function login(email, password, ip) {
  guardLogin(ip || "unknown");
  if (!email || !password) throw new HttpError(400, "Email and password are required.");

  if (!isSupabaseConfigured()) {
    if (
      email.trim().toLowerCase() === config.adminBootstrap.email.toLowerCase() &&
      password === (config.adminBootstrap.password || "Admin@1234")
    ) {
      return {
        accessToken: config.adminDevToken,
        user: {
          id: "admin-dev",
          email: normalizedEmail(config.adminBootstrap.email),
          name: config.adminBootstrap.name,
          phone: config.adminBootstrap.phone,
          role: "admin",
        },
      };
    }
    throw new HttpError(401, "Invalid email or password.");
  }

  const { data, error } = await getAnonClient().auth.signInWithPassword({
    email: normalizedEmail(email),
    password,
  });
  if (error || !data?.session) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const profile = await loadProfile(data.user.id);
  return {
    accessToken: data.session.access_token,
    user: profile,
  };
}

export async function register(input) {
  if (!isSupabaseConfigured()) {
    throw new HttpError(503, "Customer accounts need Supabase Auth to be configured.");
  }
  if (!input.email || !input.password || !input.fullName) {
    throw new HttpError(400, "Name, email and password are required.");
  }

  const { data, error } = await getAnonClient().auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: { full_name: input.fullName },
    },
  });
  if (error) throw new HttpError(400, error.message);

  const supabase = getServiceClient();
  if (data.user) {
    await supabase
      .from("profiles")
      .update({ full_name: input.fullName, phone: input.phone || null, role: "customer" })
      .eq("id", data.user.id);
  }

  return {
    accessToken: data.session?.access_token || null,
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email,
          name: input.fullName,
          phone: input.phone || null,
          role: "customer",
        }
      : null,
  };
}

export async function bootstrapAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  }
  const email = normalizedEmail(config.adminBootstrap.email);
  const password = config.adminBootstrap.password;
  if (!password) throw new Error("Set ADMIN_BOOTSTRAP_PASSWORD.");

  const supabase = getServiceClient();
  const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const wanted = String(email || "").trim().toLowerCase();
  const existingAuth = (usersPage?.users || []).find((user) => {
    const userEmail = String(user.email || "").trim().toLowerCase();
    return userEmail === wanted || userEmail === "admin@budybear.pk";
  });
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .ilike("email", email)
    .maybeSingle();

  let userId = existingAuth?.id || existingProfile?.id;
  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: config.adminBootstrap.name },
    });
    if (error) throw error;
    userId = data.user.id;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: config.adminBootstrap.name },
    });
    if (error) throw error;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      email,
      full_name: config.adminBootstrap.name,
      phone: config.adminBootstrap.phone,
      role: "admin",
    });
  if (error) throw error;
  return { id: userId, email, role: "admin" };
}

export async function updateAdminAccount(user, input = {}) {
  if (!user?.id || user.role !== "admin") {
    throw new HttpError(403, "Admin access required.");
  }
  if (!isSupabaseConfigured()) {
    throw new HttpError(503, "Account updates need Supabase Auth.");
  }

  const currentPassword = String(input.currentPassword || "");
  const nextEmail = String(input.email || "").trim().toLowerCase();
  const nextPassword = String(input.newPassword || "");
  const nextName = input.name == null ? null : String(input.name).trim();
  const nextPhone = input.phone == null ? null : String(input.phone).trim();
  const { data: authData } = await getAnonClient().auth.getUser(user.token);
  const currentEmail = String(authData?.user?.email || user.email || "").trim().toLowerCase();
  const emailChanged = Boolean(nextEmail) && nextEmail !== currentEmail;
  const passwordChanged = Boolean(nextPassword);
  const changingLogin = emailChanged || passwordChanged;

  if (!changingLogin && (input.email != null || input.newPassword != null)) {
    throw new HttpError(400, "Change the login email or enter a new password.");
  }

  if (emailChanged && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    throw new HttpError(400, "Enter a valid login email.");
  }

  const supabase = getServiceClient();
  let accessTokenOut = user.token;
  if (changingLogin) {
    if (!currentPassword) {
      throw new HttpError(400, "Enter your current password to update email or password.");
    }
    if (passwordChanged && nextPassword.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters.");
    }
    const { error: verifyError } = await getAnonClient().auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });
    if (verifyError) throw new HttpError(400, "Current password is incorrect.");

    if (emailChanged) {
      await applyLoginEmail(user.id, currentEmail, nextEmail);
    }
    if (passwordChanged) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: nextPassword,
      });
      if (updateError) throw new HttpError(400, updateError.message || "Unable to update password.");
    }

    const { data: relogin, error: reloginError } = await getAnonClient().auth.signInWithPassword({
      email: emailChanged ? nextEmail : currentEmail,
      password: passwordChanged ? nextPassword : currentPassword,
    });
    if (!reloginError && relogin?.session?.access_token) {
      accessTokenOut = relogin.session.access_token;
    }
  }

  const profilePatch = {};
  if (nextName != null) profilePatch.full_name = nextName;
  if (nextPhone != null) profilePatch.phone = nextPhone || null;
  if (emailChanged) profilePatch.email = nextEmail;
  if (Object.keys(profilePatch).length) {
    const { error: profileError } = await supabase.from("profiles").update(profilePatch).eq("id", user.id);
    if (profileError) throw new HttpError(500, "Unable to update profile.");
  }

  const profile = await loadProfile(user.id);
  return {
    accessToken: accessTokenOut,
    user: {
      ...profile,
      email: emailChanged ? nextEmail : profile.email,
    },
    needsEmailConfirm: false,
  };
}
