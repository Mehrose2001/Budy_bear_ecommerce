import { NextResponse } from "next/server";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getRequestUser } from "@/lib/supabase/server";

export async function GET(request) {
  return withBackend(request, "/auth/me", async () => {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    return NextResponse.json({ user });
  });
}
