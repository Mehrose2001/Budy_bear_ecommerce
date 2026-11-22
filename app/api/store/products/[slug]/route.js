import { NextResponse } from "next/server";
import { getProductPage, getStorefrontSettings } from "@/lib/catalog";
import { formatLabel, slugify } from "@/lib/utils";
import { productSubcategories } from "@/lib/productSubcategories";
import { siteBase } from "@/data/seo";
import { storefrontCard, storefrontProduct, storefrontReview } from "@/lib/storefrontProduct";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const page = await getProductPage(slug);
    const product = storefrontProduct(page?.product);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    const settings = await getStorefrontSettings().catch(() => null);
    const subcategories = productSubcategories(product);
    const crumbs = [
      { label: "Home", href: "/" },
      { label: formatLabel(product.category), href: `/category/${product.category}` },
    ];
    if (subcategories[0]) {
      crumbs.push({
        label: formatLabel(subcategories[0]),
        href: `/category/${product.category}?subcategory=${slugify(subcategories[0])}`,
      });
    }
    crumbs.push({ label: product.name });
    return NextResponse.json({
      ok: true,
      product,
      reviews: (page.reviews || []).map(storefrontReview).filter(Boolean),
      related: (page.related || []).map(storefrontCard).filter(Boolean),
      crumbs,
      baseUrl: siteBase(settings?.seo),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Product lookup failed." },
      { status: 500 }
    );
  }
}
