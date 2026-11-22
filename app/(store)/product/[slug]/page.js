import ProductPageClient from "@/components/product/ProductPageClient";
import { getProductPage } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const runtime = "nodejs";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;
    const page = await getProductPage(slug);
    return { title: page?.product?.name || "Product" };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  return <ProductPageClient slug={slug} />;
}
