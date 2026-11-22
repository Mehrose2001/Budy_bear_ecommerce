import { notFound } from "next/navigation";
import ProductPageView from "@/components/product/ProductPageView";
import { getProductPage, getStorefrontSettings } from "@/lib/catalog";
import { formatLabel, slugify } from "@/lib/utils";
import { buildMetadata, chooseEntry, productJsonLd, siteBase } from "@/data/seo";
import { productSubcategories } from "@/lib/productSubcategories";
import { storefrontCard, storefrontProduct, storefrontReview } from "@/lib/storefrontProduct";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const runtime = "nodejs";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getProductPage(slug);
  const product = storefrontProduct(page?.product);

  if (!product) {
    return { title: "Product not found" };
  }

  const settings = await getStorefrontSettings().catch(() => null);
  return buildMetadata({
    seo: settings?.seo,
    entry: chooseEntry(page.product?.seo, settings?.seo?.entities?.products?.[product.slug]),
    path: `/product/${product.slug}`,
    fallbackTitle: product.name,
    fallbackDescription:
      product.description ||
      `Shop ${product.name} at BudyBear. Kids clothing available with delivery across Pakistan.`,
    fallbackImage: product.images?.[0],
  });
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const page = await getProductPage(slug);
  const product = storefrontProduct(page?.product);

  if (!product) {
    notFound();
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

  return (
    <>
      <JsonLd data={productJsonLd(product, settings?.seo)} />
      <ProductPageView
        product={product}
        reviews={(page.reviews || []).map(storefrontReview).filter(Boolean)}
        related={(page.related || []).map(storefrontCard).filter(Boolean)}
        crumbs={crumbs}
        baseUrl={siteBase(settings?.seo)}
      />
    </>
  );
}
