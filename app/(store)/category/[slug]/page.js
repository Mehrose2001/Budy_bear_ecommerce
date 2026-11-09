import { Suspense } from "react";
import { notFound } from "next/navigation";
import ProductListing from "@/components/product/ProductListing";
import { getCategoryBySlug, getProductsByCategory, getStorefrontSettings, listCategories } from "@/lib/catalog";
import { buildMetadata, chooseEntry } from "@/data/seo";
import { formatLabel, slugify } from "@/lib/utils";

function CategoryFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-neutral-200" />
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

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "Category Not Found" };
  }

  const settings = await getStorefrontSettings().catch(() => null);
  const subSlug = slugify(String(query?.subcategory || ""));
  const subName = (category.subcategories || []).find(
    (name) => slugify(String(name)) === subSlug || String(name) === query?.subcategory
  );
  if (subSlug) {
    const entry = chooseEntry(
      category.subcategorySeo?.[subSlug] || category.subcategorySeo?.[slugify(String(subName || ""))],
      settings?.seo?.entities?.subcategories?.[`${category.slug}/${subSlug}`]
    );
    return buildMetadata({
      seo: settings?.seo,
      entry,
      path: `/category/${category.slug}?subcategory=${subSlug}`,
      fallbackTitle: formatLabel(subName || subSlug),
      fallbackDescription: category.description,
      fallbackImage: category.image,
    });
  }

  return buildMetadata({
    seo: settings?.seo,
    entry: chooseEntry(category.seo, settings?.seo?.entities?.categories?.[category.slug]),
    path: `/category/${category.slug}`,
    fallbackTitle: `${category.name} Collection`,
    fallbackDescription: category.description,
    fallbackImage: category.image,
  });
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const categoryProducts = await getProductsByCategory(slug);

  return (
    <Suspense fallback={<CategoryFallback />}>
      <ProductListing
        products={categoryProducts}
        category={category}
        categories={await listCategories().catch(() => [])}
        title={category.name}
        description={category.description}
        basePath={`/category/${slug}`}
        lockedCategory={slug}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/products" },
          { label: category.name },
        ]}
      />
    </Suspense>
  );
}
