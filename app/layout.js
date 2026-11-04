import { Inter } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import SiteTracking from "@/components/analytics/SiteTracking";
import JsonLd from "@/components/seo/JsonLd";
import { brand } from "@/data/brand";
import { buildMetadata, normalizeSeo, organizationJsonLd, siteBase } from "@/data/seo";
import { getStorefrontSettings } from "@/lib/catalog";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fallbackDescription = `${brand.slogan} Shop premium kids clothing and accessories. Free delivery on orders above Rs. 3,000 across Pakistan.`;

export async function generateMetadata() {
  const settings = await getStorefrontSettings().catch(() => null);
  const seo = normalizeSeo(settings?.seo);
  const meta = buildMetadata({
    seo,
    path: "/",
    home: true,
    fallbackTitle: `${brand.name} | Premium Kids Wear`,
    fallbackDescription,
    fallbackImage: brand.logo,
  });
  const title = typeof meta.title === "string" ? meta.title : meta.title.absolute;
  return {
    metadataBase: new URL(siteBase(seo)),
    title: { default: title, template: `%s | ${brand.name}` },
    description: meta.description,
    keywords: meta.keywords,
    robots: meta.robots,
    openGraph: meta.openGraph,
    twitter: meta.twitter,
  };
}

export default async function RootLayout({ children }) {
  const settings = await getStorefrontSettings().catch(() => null);
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased">
        <JsonLd data={organizationJsonLd(settings?.seo)} />
        <AppProviders>
          <SiteTracking />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
