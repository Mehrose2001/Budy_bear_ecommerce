import { Inter } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import StoreChrome from "@/components/layout/StoreChrome";
import { brand } from "@/data/brand";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: {
    default: `${brand.name} | Premium Kids Wear, Toys & School Essentials`,
    template: `%s | ${brand.name}`,
  },
  description: `${brand.slogan} Shop premium kids clothing, shoes, toys, and school essentials. Free delivery on orders above Rs. 3,000 across Pakistan.`,
  keywords: [
    "kids wear",
    "children clothing",
    "kids shoes",
    "toys Pakistan",
    "school essentials",
    brand.name,
  ],
  openGraph: {
    title: `${brand.name} | Premium Kids Wear, Toys & School Essentials`,
    description: brand.description,
    siteName: brand.name,
    locale: "en_PK",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background text-foreground antialiased">
        <AppProviders>
          <StoreChrome>{children}</StoreChrome>
        </AppProviders>
      </body>
    </html>
  );
}
