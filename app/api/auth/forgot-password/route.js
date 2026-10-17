import { NextResponse } from "next/server";
import { withBackend } from "@/lib/withBackend";
import { requestOrigin } from "@/lib/requestOrigin";
import { requestPasswordReset } from "@/services/authService";

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
    const result = await requestPasswordReset(body.email, redirectTo, attemptKey);
    return NextResponse.json(result);
  });
}
