import { config, isSupabaseConfigured } from "../config.js";
import { getAnonClient, getServiceClient } from "../supabase.js";
import { HttpError } from "../lib/http.js";
import { mapProfile } from "../lib/map.js";

function bearer(req) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
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

export async function optionalUser(req, _res, next) {
  try {
    req.user = null;
    const token = bearer(req);
    if (!token) return next();

    if (!isSupabaseConfigured() && token === config.adminDevToken) {
      req.user = {
        id: "admin-dev",
        email: config.adminBootstrap.email,
        name: config.adminBootstrap.name,
        phone: config.adminBootstrap.phone,
        role: "admin",
        token,
      };
      return next();
    }

    if (!isSupabaseConfigured()) return next();

    const { data, error } = await getAnonClient().auth.getUser(token);
    if (error || !data?.user) return next();
    const profile = await loadProfile(data.user.id);
    req.user = { ...profile, token };
    next();
  } catch (error) {
    const message = String(error?.message || "");
    if (/jwt expired|invalid jwt|invalid token/i.test(message)) {
      req.user = null;
      return next();
    }
    next(error);
  }
}

export async function requireUser(req, res, next) {
  await optionalUser(req, res, (error) => {
    if (error) return next(error);
    if (!req.user) return next(new HttpError(401, "Please sign in."));
    next();
  });
}

export async function requireAdmin(req, res, next) {
  await optionalUser(req, res, (error) => {
    if (error) return next(error);
    if (!req.user) return next(new HttpError(401, "Unauthorized"));
    if (req.user.role !== "admin") {
      return next(new HttpError(403, "Admin access required."));
    }
    next();
  });
}
