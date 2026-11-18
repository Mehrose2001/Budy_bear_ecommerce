import { Inter } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import SiteTracking from "@/components/analytics/SiteTracking";
import JsonLd from "@/components/seo/JsonLd";
import { brand } from "@/data/brand";
import { normalizeSeo, organizationJsonLd, parseRobots, SITE_NAME, siteBase } from "@/data/seo";
import { getStorefrontSettings } from "@/lib/catalog";
import "./globals.css";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// export async function generateMetadata() {
//   const settings = await getStorefrontSettings().catch(() => null);
//   const seo = normalizeSeo(settings?.seo);
//   const metadata = {
//     metadataBase: new URL(siteBase(seo)),
//     title: {
//       default: seo.title || SITE_NAME,
//       template: `%s | ${SITE_NAME}`,
//     },
//     description: seo.description || brand.description,
//     robots: parseRobots(seo.robots),
//   };
//   if (seo.logo) {
//     metadata.icons = {
//       icon: [{ url: seo.logo }],
//       apple: [{ url: seo.logo }],
//     };
//   }
//   return metadata;
// }
export async function generateMetadata() {
  const settings = await getStorefrontSettings().catch(() => null);
  const seo = normalizeSeo(settings?.seo);

  const metadata = {
    metadataBase: new URL(siteBase(seo)),
    title: {
      default: seo.title || SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: seo.description || brand.description,
    robots: parseRobots(seo.robots),

    verification: {
      google: "or7i2T48S4_TFHIG-2PHzjMDHOOM-em-MSDSVGCbL68",
    },
  };

  if (seo.logo) {
    metadata.icons = {
      icon: [{ url: seo.logo }],
      apple: [{ url: seo.logo }],
    };
  }

  return metadata;
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
