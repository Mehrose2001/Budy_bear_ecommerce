import { NextResponse } from "next/server";
import { DEMO_ADMIN, ADMIN_TOKEN } from "@/data/admin";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loginWithPassword } from "@/services/authService";

export async function POST(request) {
  return withBackend(request, "/auth/login", async () => {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (isSupabaseConfigured()) {
      const result = await loginWithPassword(email, password);
      return NextResponse.json(result);
    }

    if (email !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) {
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
