import { NextResponse } from "next/server";
import { ADMIN_TOKEN, DEMO_ADMIN } from "@/data/admin";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getRequestUser } from "@/lib/supabase/server";
import { updateAdminAccount } from "@/services/authService";
import { getAccessToken, isAdminRequest } from "@/lib/adminAuth";

function demoAdminUser() {
  return {
    id: DEMO_ADMIN.id,
    email: DEMO_ADMIN.email,
    name: DEMO_ADMIN.name,
    phone: DEMO_ADMIN.phone,
    role: "admin",
    title: DEMO_ADMIN.title,
  };
}

function isLocalDemoToken(request) {
  return process.env.NODE_ENV !== "production" && getAccessToken(request) === ADMIN_TOKEN;
}

export async function GET(request) {
  return withBackend(request, "/auth/me", async () => {
    if (isSupabaseConfigured()) {
      const user = await getRequestUser(request);
      if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
      return NextResponse.json({ user });
    }

    if (isLocalDemoToken(request)) {
      return NextResponse.json({ user: demoAdminUser() });
    }
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  });
}

export async function PATCH(request) {
  return withBackend(request, "/auth/me", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    if (isSupabaseConfigured()) {
      const result = await updateAdminAccount(getAccessToken(request), body);
      return NextResponse.json(result);
    }

    if (body.email || body.newPassword) {
      return NextResponse.json(
        { error: "Email and password changes need Supabase Auth." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      accessToken: getAccessToken(request),
      user: {
        ...demoAdminUser(),
        name: body.name ?? DEMO_ADMIN.name,
        phone: body.phone ?? DEMO_ADMIN.phone,
      },
    });
  });
}
