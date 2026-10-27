import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { refreshWithToken } from "@/services/authService";

const refreshAttempts = new Map();

function allowRefresh(key) {
  const now = Date.now();
  const entry = refreshAttempts.get(key) || { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60_000;
  }
  entry.count += 1;
  refreshAttempts.set(key, entry);
  return entry.count <= 30;
}

export async function POST(request) {
  const attemptKey =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  if (!allowRefresh(attemptKey)) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 429 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  try {
    const tokens = await refreshWithToken(body.refreshToken);
    return NextResponse.json(tokens);
  } catch (error) {
    const status = error instanceof AppError ? error.status : 401;
    return NextResponse.json({ error: "Please sign in again." }, { status });
  }
}
