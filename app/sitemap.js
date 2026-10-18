import { listCategories, listProducts } from "@/lib/catalog";

function siteUrl() {
  return String(process.env.NEXT_PUBLIC_SITE_URL || "https://budybear.com").replace(/\/$/, "");
}

export default async function sitemap() {
  const base = siteUrl();
  const [products, categories] = await Promise.all([
    listProducts().catch(() => []),
    listCategories().catch(() => []),
  ]);

  const staticRoutes = [
    "",
    "/products",
    "/contact",
    "/faqs",
    "/about",
    "/shipping",
    "/returns",
    "/size-guide",
    "/privacy",
    "/terms",
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

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
