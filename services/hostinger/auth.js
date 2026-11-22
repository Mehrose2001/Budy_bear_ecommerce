import { adminLoginEmail } from "@/data/admin";
import { AppError, throwIf } from "@/lib/errors";
import { query, queryOne } from "@/lib/db";
import { asJson, nextId, normalizeMysqlRow } from "@/lib/mysql/helpers";
import { mapProfile } from "@/lib/mappers";
import { hashPassword, verifyPassword, assertPassword } from "@/lib/auth/passwords";
import {
  createResetToken,
  hashResetToken,
  sessionPayload,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/auth/tokens";
import { isSmtpConfigured } from "@/lib/orderEmail";
import nodemailer from "nodemailer";

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

function normalizedEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function smtpSettings() {
  const env = process.env || {};
  return {
    user: String(env.SMTP_USER || "").trim(),
    pass: String(env.SMTP_PASS || "").replace(/\s+/g, ""),
    host: String(env.SMTP_HOST || "smtp.gmail.com").trim(),
    port: Number(env.SMTP_PORT || 465),
  };
}

async function loadMappedProfile(userId) {
  const row = normalizeMysqlRow(
    await queryOne("SELECT id, email, full_name, phone, address, city, role FROM profiles WHERE id = ?", [userId])
  );
  return mapProfile(row);
}

function tokensFor(user) {
  return sessionPayload(user, signAccessToken(user), signRefreshToken(user));
}

export async function loginWithPassword(email, password, attemptKey = "unknown") {
  guardLogin(String(attemptKey || "unknown"));
  if (!email || !password) throw new AppError("Email and password are required.", 400);
  const address = normalizedEmail(email);
  const user = await queryOne("SELECT * FROM users WHERE email = ?", [address]);
  if (!user) throw new AppError("Invalid email or password.", 401);
  if (!user.password_hash || Number(user.password_needs_reset) === 1) {
    throw new AppError(
      "This account needs a password reset before it can be used on the new login system. Use Forgot password.",
      401
    );
  }
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw new AppError("Invalid email or password.", 401);
  await query("UPDATE users SET last_sign_in_at = ? WHERE id = ?", [new Date(), user.id]);
  const profile = await loadMappedProfile(user.id);
  if (!profile) throw new AppError("Invalid email or password.", 401);
  return tokensFor(profile);
}

export async function refreshWithToken(token) {
  const payload = verifyRefreshToken(token);
  if (!payload?.sub) throw new AppError("Please sign in again.", 401);
  const profile = await loadMappedProfile(payload.sub);
  if (!profile) throw new AppError("Please sign in again.", 401);
  if (String(profile.role || "").toLowerCase() === "admin") {
    if (String(profile.email || "").trim().toLowerCase() !== adminLoginEmail()) {
      throw new AppError("Please sign in again.", 401);
    }
  }
  return tokensFor(profile);
}

export async function registerWithPassword(input) {
  if (!input.email || !input.password || !input.fullName) {
    throw new AppError("Name, email and password are required.", 400);
  }
  assertPassword(input.password);
  const email = normalizedEmail(input.email);
  const existing = await queryOne("SELECT id FROM users WHERE email = ?", [email]);
  if (existing) throw new AppError("An account with this email already exists. Sign in instead.", 400);
  const id = nextId();
  const passwordHash = await hashPassword(input.password);
  await query(
    `INSERT INTO users (id, email, password_hash, password_algo, password_needs_reset, email_confirmed_at, raw_user_meta)
     VALUES (?, ?, ?, 'bcrypt', 0, ?, ?)`,
    [id, email, passwordHash, new Date(), asJson({ full_name: input.fullName, phone: input.phone || "" }, {})]
  );
  await query(
    `INSERT INTO profiles (id, email, full_name, phone, role) VALUES (?, ?, ?, ?, 'customer')`,
    [id, email, String(input.fullName).trim(), String(input.phone || "").trim() || null]
  );
  const profile = await loadMappedProfile(id);
  return { ...tokensFor(profile), needsConfirm: false };
}

export async function getUserFromAccessToken(accessToken) {
  const payload = verifyAccessToken(accessToken);
  if (!payload?.sub) return null;
  const profile = await loadMappedProfile(payload.sub);
  if (!profile) return null;
  return { ...profile, accessToken };
}

export async function loadProfile(accessToken, userId) {
  return loadMappedProfile(userId);
}

export async function updateAdminAccount(accessToken, input = {}) {
  const current = await getUserFromAccessToken(accessToken);
  if (!current) throw new AppError("Please sign in.", 401);
  if (String(current.role || "").toLowerCase() !== "admin") {
    throw new AppError("Admin access required.", 403);
  }
  const currentPassword = String(input.currentPassword || "");
  const nextEmail = String(input.email || "").trim().toLowerCase();
  const nextPassword = String(input.newPassword || "");
  const nextName = input.name == null ? null : String(input.name).trim();
  const nextPhone = input.phone == null ? null : String(input.phone).trim();
  const emailChanged = Boolean(nextEmail) && nextEmail !== current.email;
  if (emailChanged && nextEmail !== adminLoginEmail()) {
    throw new AppError(`Admin login is restricted to ${adminLoginEmail()}.`, 400);
  }
  const passwordChanged = Boolean(nextPassword);
  const changingLogin = emailChanged || passwordChanged;
  if (changingLogin) {
    if (!currentPassword) {
      throw new AppError("Enter your current password to update email or password.", 400);
    }
    const user = await queryOne("SELECT * FROM users WHERE id = ?", [current.id]);
    const ok = await verifyPassword(currentPassword, user?.password_hash);
    if (!ok) throw new AppError("Current password is incorrect.", 400);
    if (passwordChanged) {
      assertPassword(nextPassword);
      const hash = await hashPassword(nextPassword);
      await query(
        "UPDATE users SET password_hash = ?, password_algo = 'bcrypt', password_needs_reset = 0 WHERE id = ?",
        [hash, current.id]
      );
    }
    if (emailChanged) {
      await query("UPDATE users SET email = ? WHERE id = ?", [nextEmail, current.id]);
      await query("UPDATE profiles SET email = ? WHERE id = ?", [nextEmail, current.id]);
    }
  }
  const profilePatch = [];
  const values = [];
  if (nextName != null) {
    profilePatch.push("full_name = ?");
    values.push(nextName);
  }
  if (nextPhone != null) {
    profilePatch.push("phone = ?");
    values.push(nextPhone || null);
  }
  if (profilePatch.length) {
    values.push(current.id);
    await query(`UPDATE profiles SET ${profilePatch.join(", ")} WHERE id = ?`, values);
  }
  const user = await loadMappedProfile(current.id);
  return tokensFor({
    ...user,
    email: emailChanged ? nextEmail : user.email,
  });
}

const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, we sent a password reset link. Check your inbox and spam folder.";

export async function requestPasswordReset(email, redirectTo, attemptKey = "unknown") {
  guardLogin(String(attemptKey || "unknown"));
  const address = normalizedEmail(email);
  if (!address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw new AppError("Enter a valid email address.", 400);
  }
  const user = await queryOne("SELECT id, email FROM users WHERE email = ?", [address]);
  if (!user) return { message: GENERIC_RESET_MESSAGE };
  if (!isSmtpConfigured()) {
    throw new AppError("Password reset needs SMTP_USER and SMTP_PASS.", 503);
  }
  const { token, tokenHash } = createResetToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await query("DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL", [user.id]);
  await query(
    "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    [nextId(), user.id, tokenHash, expires]
  );
  const target = String(redirectTo || "").replace(/\/$/, "");
  const link = `${target}${target.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}&email=${encodeURIComponent(address)}`;
  const smtp = smtpSettings();
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  await transporter.sendMail({
    from: `"Budy Bear" <${smtp.user}>`,
    to: address,
    subject: "Reset your Budy Bear password",
    text: `Reset your password using this link (valid for 1 hour):\n${link}\n`,
    html: `<p>Reset your password using this link (valid for 1 hour):</p><p><a href="${link}">${link}</a></p>`,
  });
  return { message: GENERIC_RESET_MESSAGE };
}

export async function resetPasswordWithToken({ token, email, password }) {
  assertPassword(password);
  const address = normalizedEmail(email);
  const tokenHash = hashResetToken(token);
  const row = await queryOne(
    `SELECT t.*, u.email FROM password_reset_tokens t
     JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = ? AND t.used_at IS NULL`,
    [tokenHash]
  );
  if (!row || (address && normalizedEmail(row.email) !== address)) {
    throw new AppError("This reset link is invalid or has expired. Request a new one.", 400);
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new AppError("This reset link is invalid or has expired. Request a new one.", 400);
  }
  const hash = await hashPassword(password);
  await query(
    "UPDATE users SET password_hash = ?, password_algo = 'bcrypt', password_needs_reset = 0 WHERE id = ?",
    [hash, row.user_id]
  );
  await query("UPDATE password_reset_tokens SET used_at = ? WHERE id = ?", [new Date(), row.id]);
  return { message: "Your password has been updated. You can sign in now." };
}
