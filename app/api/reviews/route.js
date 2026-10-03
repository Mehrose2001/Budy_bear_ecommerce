import { NextResponse } from "next/server";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getRequestUser } from "@/lib/supabase/server";
import { addReview, listReviews } from "@/lib/catalogStore";
import { createReview, getProductReviews } from "@/services/reviewService";
import { AppError } from "@/lib/errors";
import { invalidateCatalogSnapshot } from "@/lib/catalog";

export async function GET(request) {
  try {
    const productId = new URL(request.url).searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }
    if (isSupabaseConfigured()) {
      const reviews = await getProductReviews(productId);
      return NextResponse.json({ reviews });
    }
    const reviews = listReviews().filter(
      (review) =>
        Number(review.productId) === Number(productId) && review.status !== "Hidden"
    );
    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to load reviews." },
      { status: error instanceof AppError ? error.status : 500 }
    );
  }
}

export async function POST(request) {
  return withBackend(request, "/catalog/reviews", async () => {
    const body = await request.json().catch(() => ({}));
    if (isSupabaseConfigured()) {
      const user = await getRequestUser(request);
      const review = await createReview({
        ...body,
        userId: user?.id || null,
        author: body.author || user?.name || "Customer",
      });
      invalidateCatalogSnapshot();
      return NextResponse.json({ review }, { status: 201 });
    }
    const review = addReview({
      ...body,
      author: body.author || "Customer",
    });
    if (!review) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ review }, { status: 201 });
  });
}
