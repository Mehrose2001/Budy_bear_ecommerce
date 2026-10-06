import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import { listCategories } from "@/lib/catalog";
import { buildFooterShop, buildMainNav } from "@/lib/storeNav";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }) {
  const categories = await listCategories().catch(() => []);
  const navItems = buildMainNav(categories);
  const shopLinks = buildFooterShop(categories);

  return (
    <>
      <Header navItems={navItems} />
      <main className="flex-1">{children}</main>
      <Footer shopLinks={shopLinks} />
      <WhatsAppFloat />
    </>
  );
}
