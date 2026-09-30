import { config, isSupabaseConfigured } from "../config.js";
import { HttpError } from "../lib/http.js";
import { mapProfile } from "../lib/map.js";
import { getAnonClient, getServiceClient } from "../supabase.js";

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

async function loadProfile(userId) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new HttpError(500, "Unable to load account.");
  return mapProfile(data);
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
          email: config.adminBootstrap.email,
          name: config.adminBootstrap.name,
          phone: config.adminBootstrap.phone,
          role: "admin",
        },
      };
    }
    throw new HttpError(401, "Invalid email or password.");
  }

  const { data, error } = await getAnonClient().auth.signInWithPassword({
    email: email.trim(),
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
  const email = config.adminBootstrap.email;
  const password = config.adminBootstrap.password;
  if (!password) throw new Error("Set ADMIN_BOOTSTRAP_PASSWORD.");

  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("email", email)
    .maybeSingle();

  let userId = existing?.id;
  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: config.adminBootstrap.name },
    });
    if (error) throw error;
    userId = data.user.id;
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
