import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ProductDetailsClient from "@/components/product/ProductDetailsClient";
import ProductReviews from "@/components/product/ProductReviews";
import ProductGrid from "@/components/product/ProductGrid";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import {
  getProductBySlug,
  getRelatedProducts,
  listProducts,
} from "@/lib/catalogStore";
import { formatLabel } from "@/lib/utils";
import { brand } from "@/data/brand";

export async function generateStaticParams() {
  return listProducts().map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "Product not found" };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} | ${brand.name}`,
      description: product.description,
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
              ["Available colors", product.colors.join(", ")],
              ["Stock", String(product.stock)],
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
        <ProductReviews product={product} />
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
