import { Suspense } from "react";
import ProductListing from "@/components/product/ProductListing";
import { getStorefrontSettings, listCategories, searchCatalog } from "@/lib/catalog";
import { buildMetadata, siteBase } from "@/data/seo";

export async function generateMetadata() {
  const settings = await getStorefrontSettings().catch(() => null);
  const meta = buildMetadata({
    seo: settings?.seo,
    path: "/search",
    fallbackTitle: "Search Products",
    fallbackDescription: "Search Budy Bear kidswear by name, category, or type.",
  });
  return { ...meta, robots: { index: false, follow: true } };
}

function SearchFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="h-10 w-80 animate-pulse rounded-xl bg-neutral-200" />
    </div>
  );
}

export default async function SearchPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q || "";
  const [results, settings] = await Promise.all([
    query ? searchCatalog(query) : [],
    getStorefrontSettings().catch(() => null),
  ]);

  return (
    <Suspense fallback={<SearchFallback />}>
      <ProductListing
        products={results}
        siteUrl={siteBase(settings?.seo)}
        categories={await listCategories().catch(() => [])}
        title={query ? `Search results for "${query}"` : "Search Products"}
        description={
          query
            ? `Found ${results.length} product${results.length === 1 ? "" : "s"} matching your search.`
            : "Enter a search term from the header to find products."
        }
        basePath="/search"
        searchQuery={query}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Search" },
        ]}
      />
    </Suspense>
  );
}
