import { Suspense } from "react";
import ProductListing from "@/components/product/ProductListing";
import { listProducts } from "@/lib/catalogStore";
import { brand } from "@/data/brand";

function ProductsFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-neutral-200" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden h-[600px] animate-pulse rounded-2xl bg-neutral-100 lg:block" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse rounded-2xl bg-neutral-100"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Shop All Products",
  description: `Browse ${brand.name} kids wear and accessories. Filter by category, price, size, and more.`,
};

export default async function ProductsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const presetFilter = resolvedSearchParams?.filter || null;

  const title =
    presetFilter === "sale"
      ? "Sale"
      : presetFilter === "new-arrivals"
        ? "New Arrivals"
        : "All Products";

  const description =
    presetFilter === "sale"
      ? "Discover great savings on premium kids products."
      : presetFilter === "new-arrivals"
        ? "Explore the latest additions to our collection."
        : "Browse our complete catalog of kids fashion and essentials.";

  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductListing
        products={listProducts()}
        title={title}
        description={description}
        basePath="/products"
        presetFilter={presetFilter}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: title },
        ]}
      />
    </Suspense>
  );
}
