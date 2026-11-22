import { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { AppError } from "@/lib/errors";

function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function accessSecret() {
  const secret = clean(process.env.JWT_SECRET);
  if (!secret) {
    throw new AppError("JWT_SECRET is not configured on the server.", 503);
  }
  return secret;
}

function refreshSecret() {
  return clean(process.env.JWT_REFRESH_SECRET) || accessSecret();
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role || "customer",
      typ: "access",
    },
    accessSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role || "customer",
      typ: "refresh",
    },
    refreshSecret(),
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "14d" }
  );
}

export function verifyAccessToken(token) {
  const raw = String(token || "").trim();
  if (!raw) return null;
  try {
    const payload = jwt.verify(raw, accessSecret());
    if (payload?.typ && payload.typ !== "access") return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  const raw = String(token || "").trim();
  if (!raw) return null;
  try {
    const payload = jwt.verify(raw, refreshSecret());
    if (payload?.typ && payload.typ !== "refresh") return null;
    return payload;
  } catch {
    return null;
  }
}

export function createResetToken() {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export function sessionPayload(user, accessToken, refreshToken) {
  return {
    accessToken,
    refreshToken,
    user,
  };
}
