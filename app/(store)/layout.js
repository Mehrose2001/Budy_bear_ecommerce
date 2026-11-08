import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import { DeliveryHydrator } from "@/context/DeliverySettingsContext";
import { OfferHydrator } from "@/context/StoreOfferContext";
import { getStorefrontSettings, listCategories } from "@/lib/catalog";
import { buildFooterShop, buildMainNav } from "@/lib/storeNav";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }) {
  const [categories, settings] = await Promise.all([
    listCategories().catch(() => []),
    getStorefrontSettings().catch(() => null),
  ]);
  const navItems = buildMainNav(categories);
  const shopLinks = buildFooterShop(categories);

  return (
    <>
      <OfferHydrator offer={settings?.offer} />
      <DeliveryHydrator
        delivery={{
          deliveryFee: settings?.deliveryFee,
          freeDeliveryThreshold: settings?.freeDeliveryThreshold,
        }}
      />
      <Header navItems={navItems} announcement={settings?.announcement || ""} />
      <main className="flex-1 min-w-0">{children}</main>
      <Footer
        shopLinks={shopLinks}
        supportEmail={settings?.supportEmail}
        supportPhone={settings?.supportPhone}
      />
      <WhatsAppFloat />
    </>
  );
}
