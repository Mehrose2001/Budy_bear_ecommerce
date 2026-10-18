import { Inter } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import SiteTracking from "@/components/analytics/SiteTracking";
import { brand } from "@/data/brand";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || "https://budybear.com").replace(
  /\/$/,
  ""
);

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${brand.name} | Premium Kids Wear`,
    template: `%s | ${brand.name}`,
  },
  description: `${brand.slogan} Shop premium kids clothing and accessories. Free delivery on orders above Rs. 3,000 across Pakistan.`,
  keywords: [
    "kids wear",
    "children clothing",
    "kids fashion Pakistan",
    brand.name,
  ],
  openGraph: {
    title: `${brand.name} | Premium Kids Wear`,
    description: brand.description,
    siteName: brand.name,
    locale: "en_PK",
    type: "website",
    url: siteUrl,
    images: [{ url: "/images/brand/logo.jpg" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased">
        <AppProviders>
          <SiteTracking />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
