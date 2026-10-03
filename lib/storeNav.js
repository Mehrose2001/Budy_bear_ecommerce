import { footerLinks, mainNavItems } from "@/data/navigation";
import { formatLabel } from "@/lib/utils";

export function buildMainNav(categories = []) {
  const visible = categories.filter((category) => category?.slug && category.isActive !== false);
  if (!visible.length) return mainNavItems;

  const categoryItems = visible.map((category) => {
    const slug = category.slug;
    const subs = Array.isArray(category.subcategories) ? category.subcategories : [];
    return {
      label: String(category.name || slug).toUpperCase(),
      href: `/category/${slug}`,
      megaMenu: subs.map((sub) => ({
        label: formatLabel(String(sub)),
        href: `/category/${slug}?subcategory=${encodeURIComponent(sub)}`,
      })),
    };
  });

  return [
    { label: "HOME", href: "/" },
    ...categoryItems,
    { label: "NEW ARRIVALS", href: "/products?filter=new-arrivals" },
    { label: "SALE", href: "/products?filter=sale" },
  ];
}

export function buildFooterShop(categories = []) {
  const fromCatalog = categories
    .filter((category) => category?.slug && category.isActive !== false)
    .map((category) => ({
      label: category.name,
      href: `/category/${category.slug}`,
    }));
  const extras = footerLinks.shop.filter(
    (item) => item.href.startsWith("/products")
  );
  return fromCatalog.length ? [...fromCatalog, ...extras] : footerLinks.shop;
}
