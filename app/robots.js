function siteUrl() {
  return String(process.env.NEXT_PUBLIC_SITE_URL || "https://budybear.com").replace(/\/$/, "");
}

export default function robots() {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/checkout", "/account"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
