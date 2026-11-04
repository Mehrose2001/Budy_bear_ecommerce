import { listCategories, listProducts, getStorefrontSettings } from "@/lib/catalog";
import { LEGAL_PAGES } from "@/data/legalPages";
import { parseRobots, siteBase } from "@/data/seo";
import { slugify } from "@/lib/utils";

export default async function sitemap() {
  const settings = await getStorefrontSettings().catch(() => null);
  if (!parseRobots(settings?.seo?.robots).index) return [];
  const base = siteBase(settings?.seo);
  const [products, categories] = await Promise.all([
    listProducts().catch(() => []),
    listCategories().catch(() => []),
  ]);

  const staticRoutes = [
    "",
    "/products",
    "/contact",
    "/faqs",
    "/size-guide",
    ...Object.values(LEGAL_PAGES).map((page) => page.href),
  ].map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const productRoutes = (products || [])
    .filter((product) => product?.slug)
    .map((product) => ({
      url: `${base}/product/${product.slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const categoryRoutes = (categories || [])
    .filter((category) => category?.slug)
    .map((category) => ({
      url: `${base}/category/${category.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  const subcategoryRoutes = (categories || []).flatMap((category) =>
    (category?.subcategories || [])
      .map((name) => slugify(String(name)))
      .filter(Boolean)
      .map((subSlug) => ({
        url: `${base}/category/${category.slug}?subcategory=${subSlug}`,
        changeFrequency: "weekly",
        priority: 0.5,
      }))
  );

  return [...staticRoutes, ...categoryRoutes, ...subcategoryRoutes, ...productRoutes];
}
