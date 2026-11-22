import { NextResponse } from "next/server";
import { getProductPage } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const page = await getProductPage(slug);
    if (!page?.product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      name: page.product.name,
      slug: page.product.slug,
      imageCount: Array.isArray(page.product.images) ? page.product.images.length : 0,
      relatedCount: Array.isArray(page.related) ? page.related.length : 0,
      reviewCount: Array.isArray(page.reviews) ? page.reviews.length : 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Product lookup failed." },
      { status: 500 }
    );
  }
}
