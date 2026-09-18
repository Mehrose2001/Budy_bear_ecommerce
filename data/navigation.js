export const announcement = "Free Delivery on Orders Above Rs. 3,000";

export const announcementMessages = [
  "Free Delivery on Orders Above Rs. 3,000",
  "Cash on Delivery available across Pakistan",
  "Easy returns within 7 days",
  "New arrivals dropping every week",
];

export const mainNavItems = [
  { label: "HOME", href: "/" },
  {
    label: "BOYS",
    href: "/category/boys",
    megaMenu: [
      { label: "T-Shirts", href: "/category/boys?subcategory=t-shirts" },
      { label: "Shirts", href: "/category/boys?subcategory=shirts" },
      { label: "Pants", href: "/category/boys?subcategory=pants" },
      { label: "Shorts", href: "/category/boys?subcategory=shorts" },
      { label: "Tracksuits", href: "/category/boys?subcategory=tracksuits" },
      { label: "Jackets", href: "/category/boys?subcategory=jackets" },
    ],
  },
  {
    label: "GIRLS",
    href: "/category/girls",
    megaMenu: [
      { label: "Tops", href: "/category/girls?subcategory=tops" },
      { label: "Dresses", href: "/category/girls?subcategory=dresses" },
      { label: "Frocks", href: "/category/girls?subcategory=frocks" },
      { label: "Pants", href: "/category/girls?subcategory=pants" },
      { label: "Skirts", href: "/category/girls?subcategory=skirts" },
      { label: "Jackets", href: "/category/girls?subcategory=jackets" },
    ],
  },
  {
    label: "BABY",
    href: "/category/baby",
    megaMenu: [
      { label: "Newborn", href: "/category/baby?subcategory=newborn" },
      { label: "Baby Boys", href: "/category/baby?subcategory=baby-boys" },
      { label: "Baby Girls", href: "/category/baby?subcategory=baby-girls" },
      { label: "Rompers", href: "/category/baby?subcategory=rompers" },
      { label: "Baby Sets", href: "/category/baby?subcategory=baby-sets" },
    ],
  },
  { label: "ACCESSORIES", href: "/category/accessories" },
  { label: "NEW ARRIVALS", href: "/products?filter=new-arrivals" },
  { label: "SALE", href: "/products?filter=sale" },
];

export const shopCategories = [
  { label: "Boys", href: "/category/boys", image: "/images/categories/boys.svg" },
  { label: "Girls", href: "/category/girls", image: "/images/categories/girls.svg" },
  { label: "Baby", href: "/category/baby", image: "/images/categories/baby.svg" },
  { label: "Accessories", href: "/category/accessories", image: "/images/categories/accessories.svg" },
  { label: "Gifts", href: "/category/gifts", image: "/images/categories/gifts.svg" },
];

export const footerLinks = {
  shop: [
    { label: "Boys", href: "/category/boys" },
    { label: "Girls", href: "/category/girls" },
    { label: "Baby", href: "/category/baby" },
    { label: "Accessories", href: "/category/accessories" },
    { label: "New Arrivals", href: "/products?filter=new-arrivals" },
    { label: "Sale", href: "/products?filter=sale" },
  ],
  customerCare: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faqs" },
    { label: "Shipping & Delivery", href: "/shipping" },
    { label: "Returns & Exchanges", href: "/returns" },
    { label: "Size Guide", href: "/size-guide" },
  ],
  company: [
    { label: "About Budy Bear", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
  social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Facebook", href: "https://facebook.com" },
    { label: "TikTok", href: "https://tiktok.com" },
    { label: "YouTube", href: "https://youtube.com" },
  ],
};
