import { NextResponse } from "next/server";
import { withBackend } from "@/lib/withBackend";
import { resetPasswordWithToken } from "@/services/authService";

export async function POST(request) {
  return withBackend(request, "/auth/reset-password", async () => {
    const body = await request.json().catch(() => ({}));
    const result = await resetPasswordWithToken({
      accessToken: body.accessToken,
      tokenHash: body.tokenHash,
      password: body.password,
    });
    return NextResponse.json(result);
  });
}
