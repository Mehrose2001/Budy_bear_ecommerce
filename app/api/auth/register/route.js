import { NextResponse } from "next/server";
import { withBackend } from "@/lib/withBackend";
import { isLiveBackendConfigured } from "@/lib/backendMode";
import { registerWithPassword } from "@/services/authService";

export async function POST(request) {
  return withBackend(request, "/auth/register", async () => {
    if (!isLiveBackendConfigured()) {
      return NextResponse.json(
        { error: "Customer accounts are not configured." },
        { status: 503 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const result = await registerWithPassword({
      email: body.email,
      password: body.password,
      fullName: body.fullName || body.name,
      phone: body.phone,
    });
    return NextResponse.json(result, { status: 201 });
  });
}
