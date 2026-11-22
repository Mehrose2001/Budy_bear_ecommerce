import bcrypt from "bcryptjs";
import { AppError } from "@/lib/errors";

const ROUNDS = 12;

export function assertPassword(password) {
  if (String(password || "").length < 8) {
    throw new AppError("Password must be at least 8 characters.", 400);
  }
}

export function looksLikeBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(String(value || ""));
}

export async function hashPassword(password) {
  assertPassword(password);
  return bcrypt.hash(String(password), ROUNDS);
}

export async function verifyPassword(password, hash) {
  if (!password || !looksLikeBcryptHash(hash)) return false;
  try {
    return await bcrypt.compare(String(password), String(hash));
  } catch {
    return false;
  }
}
