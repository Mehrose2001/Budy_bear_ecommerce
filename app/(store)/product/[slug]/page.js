import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ProductDetailsClient from "@/components/product/ProductDetailsClient";
import ProductReviews from "@/components/product/ProductReviews";
import ProductGrid from "@/components/product/ProductGrid";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import { getProductPage, getStorefrontSettings, listProducts } from "@/lib/catalog";
import { getProductColors } from "@/lib/productImages";
import { formatLabel } from "@/lib/utils";
import { buildMetadata, chooseEntry, productJsonLd } from "@/data/seo";
import JsonLd from "@/components/seo/JsonLd";

export const revalidate = 30;

export async function generateStaticParams() {
  const products = await listProducts();
  return products
    .filter((product) => product.slug)
    .map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getProductPage(slug);
  const product = page?.product;

  if (!product) {
    return { title: "Product not found" };
  }

  const settings = await getStorefrontSettings().catch(() => null);
  return buildMetadata({
    seo: settings?.seo,
    entry: chooseEntry(product.seo, settings?.seo?.entities?.products?.[product.slug]),
    path: `/product/${product.slug}`,
    fallbackTitle: product.name,
    fallbackDescription: product.description,
    fallbackImage: product.images?.[0],
  });
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const page = await getProductPage(slug);
  const product = page?.product;

  if (!product) {
    notFound();
  }

  const related = page.related || [];

  const settings = await getStorefrontSettings().catch(() => null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={productJsonLd(product, settings?.seo)} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: formatLabel(product.category), href: `/category/${product.category}` },
          { label: product.name },
        ]}
      />

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
              ["Type", formatLabel(product.subcategory)],
              ["Available sizes", product.sizes.join(", ")],
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
}
