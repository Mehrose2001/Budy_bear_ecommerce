import { siteBase } from "@/data/seo";
import { getStorefrontSettings } from "@/lib/catalog";

export default async function robots() {
  const settings = await getStorefrontSettings().catch(() => null);
  const base = siteBase(settings?.seo);
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/checkout", "/account", "/cart", "/wishlist", "/order"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
