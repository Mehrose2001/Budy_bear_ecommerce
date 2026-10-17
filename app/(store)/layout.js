import { unstable_noStore as noStore } from "next/cache";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import { getStorefrontSettings, listCategories } from "@/lib/catalog";
import { buildFooterShop, buildMainNav } from "@/lib/storeNav";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }) {
  noStore();
  const [categories, settings] = await Promise.all([
    listCategories().catch(() => []),
    getStorefrontSettings().catch(() => null),
  ]);
  const navItems = buildMainNav(categories);
  const shopLinks = buildFooterShop(categories);

  return (
    <>
      <Header navItems={navItems} announcement={settings?.announcement || ""} />
      <main className="flex-1">{children}</main>
      <Footer
        shopLinks={shopLinks}
        supportEmail={settings?.supportEmail}
        supportPhone={settings?.supportPhone}
      />
      <WhatsAppFloat />
    </>
  );
}
