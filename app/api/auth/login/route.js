import { NextResponse } from "next/server";
import { DEMO_ADMIN, ADMIN_TOKEN } from "@/data/admin";
import { AppError } from "@/lib/errors";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loginWithPassword } from "@/services/authService";

const loginAttempts = new Map();

function guardDemoLogin(key) {
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

export async function POST(request) {
  return withBackend(request, "/auth/login", async () => {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const attemptKey =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "local";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const result = await loginWithPassword(email, password, attemptKey);
      return NextResponse.json(result);
    }

    guardDemoLogin(attemptKey);
    if (email !== DEMO_ADMIN.email.toLowerCase() || password !== process.env.ADMIN_BOOTSTRAP_PASSWORD) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    return NextResponse.json({
      accessToken: ADMIN_TOKEN,
      user: {
        id: DEMO_ADMIN.id,
        email: DEMO_ADMIN.email,
        name: DEMO_ADMIN.name,
        phone: DEMO_ADMIN.phone,
        role: "admin",
        title: DEMO_ADMIN.title,
      },
    });
  });
}
