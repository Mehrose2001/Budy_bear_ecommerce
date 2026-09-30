import { NextResponse } from "next/server";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBearerToken, getRequestUser } from "@/lib/supabase/server";
import { createReview } from "@/services/reviewService";

export async function POST(request) {
  return withBackend(request, "/catalog/reviews", async () => {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Reviews are saved once the store API is connected." },
        { status: 503 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const user = await getRequestUser(request);
    const review = await createReview(
      {
        ...body,
        userId: user?.id || null,
        author: body.author || user?.name || "Customer",
      },
      getBearerToken(request)
    );
    return NextResponse.json({ review }, { status: 201 });
  });
}
