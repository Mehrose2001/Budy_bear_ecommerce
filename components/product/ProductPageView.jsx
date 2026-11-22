"use client";

import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ProductDetailsClient from "@/components/product/ProductDetailsClient";
import ProductReviews from "@/components/product/ProductReviews";
import ProductGrid from "@/components/product/ProductGrid";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import { getProductColors } from "@/lib/productImages";
import { formatLabel } from "@/lib/utils";
import { productSubcategories } from "@/lib/productSubcategories";

export default function ProductPageView({ product, reviews = [], related = [], crumbs = [], baseUrl = "" }) {
  const subcategories = productSubcategories(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={crumbs} baseUrl={baseUrl} />
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
        <ProductReviews product={product} reviews={reviews} />
      </div>

      <section className="mt-16">
        <h2 className="mb-6 text-2xl font-black text-neutral-900">Related products</h2>
        <ProductGrid products={related} />
      </section>

      <RecentlyViewed currentProductId={product.id} />
    </div>
  );
}
