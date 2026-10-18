import { NextResponse } from "next/server";
import { withBackend } from "@/lib/withBackend";
import { requestOrigin } from "@/lib/requestOrigin";
import { requestPasswordReset } from "@/services/authService";
import { adminLoginEmail, isExactAdminLoginEmail } from "@/data/admin";

export async function POST(request) {
  return withBackend(request, "/auth/forgot-password", async () => {
    const body = await request.json().catch(() => ({}));
    const audience = String(body.audience || "customer").toLowerCase() === "admin" ? "admin" : "customer";
    const origin = requestOrigin(request);
    const redirectTo = `${origin}${audience === "admin" ? "/admin/reset-password" : "/reset-password"}`;
    const attemptKey =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "local";
    if (audience === "admin" && !isExactAdminLoginEmail(body.email)) {
      return NextResponse.json(
        { error: `Admin login is restricted to ${adminLoginEmail()}.` },
        { status: 400 }
      );
    }
    const result = await requestPasswordReset(body.email, redirectTo, attemptKey);
    return NextResponse.json(result);
  });
}
