import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ProductDetailsClient from "@/components/product/ProductDetailsClient";
import ProductReviews from "@/components/product/ProductReviews";
import ProductGrid from "@/components/product/ProductGrid";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import { getProductPage, getStorefrontSettings } from "@/lib/catalog";
import { getProductColors } from "@/lib/productImages";
import { formatLabel, slugify } from "@/lib/utils";
import { buildMetadata, chooseEntry, productJsonLd, siteBase } from "@/data/seo";
import { productSubcategories } from "@/lib/productSubcategories";
import JsonLd from "@/components/seo/JsonLd";

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
    const product = page?.product;

    if (!product) {
      return { title: "Product not found" };
    }

    const settings = await getStorefrontSettings().catch(() => null);
    const fallbackImage =
      typeof product.images?.[0] === "string" ? product.images[0] : product.images?.[0]?.url || "";
    return buildMetadata({
      seo: settings?.seo,
      entry: chooseEntry(product.seo, settings?.seo?.entities?.products?.[product.slug]),
      path: `/product/${product.slug}`,
      fallbackTitle: product.name,
      fallbackDescription:
        product.description ||
        `Shop ${product.name} at BudyBear. Kids clothing available with delivery across Pakistan.`,
      fallbackImage,
    });
  } catch (error) {
    console.error("Product metadata failed.", error);
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }) {
  let slug = "";
  try {
    ({ slug } = await params);
    const page = await getProductPage(slug);
    const product = page?.product;

    if (!product) {
      notFound();
    }

  const related = page.related || [];

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={productJsonLd(product, settings?.seo)} />
      <Breadcrumbs items={crumbs} baseUrl={siteBase(settings?.seo)} />

      <ProductDetailsClient product={product} />

      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-black text-neutral-900">Description</h2>
          <p className="mt-4 leading-7 text-neutral-600">{product.description}</p>
        </div>
        <div>
          <h2 className="text-2xl font-black text-neutral-900">Specifications</h2>
          <dl className="mt-4 divide-y divide-neutral-200 rounded-2xl border border-neutral-200">
            {[
              ["Brand", product.brand],
              ["Category", formatLabel(product.category)],
              ["Type", subcategories.map((name) => formatLabel(name)).join(", ") || "—"],
              ["Available sizes", (Array.isArray(product.sizes) ? product.sizes : []).join(", ")],
              ["Available colors", getProductColors(product).join(", ") || "—"],
              ["Stock", product.stock > 0 ? String(product.stock) : "Sold out"],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-2 gap-4 px-5 py-3 text-sm">
                <dt className="text-neutral-500">{label}</dt>
                <dd className="font-medium text-neutral-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mt-14">
        <ProductReviews product={product} reviews={page.reviews || []} />
      </div>

      <section className="mt-16">
        <h2 className="mb-6 text-2xl font-black text-neutral-900">
          Related products
        </h2>
        <ProductGrid products={related} />
      </section>

      <RecentlyViewed currentProductId={product.id} />
    </div>
  );
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("Product page failed.", error);
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-black text-neutral-900">This product page failed to render</h1>
        <p className="mt-4 text-sm text-neutral-600">{error?.message || String(error)}</p>
      </div>
    );
  }
}
