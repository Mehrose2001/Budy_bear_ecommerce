export const announcement = "Free Delivery on Orders Above Rs. 3,000";

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
      { label: "Shoes", href: "/category/shoes?subcategory=boys-shoes" },
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
      { label: "Shoes", href: "/category/shoes?subcategory=girls-shoes" },
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
  { label: "SHOES", href: "/category/shoes" },
  {
    label: "TOYS",
    href: "/category/toys",
    megaMenu: [
      { label: "Educational", href: "/category/toys?subcategory=educational" },
      { label: "Dolls", href: "/category/toys?subcategory=dolls" },
      { label: "Vehicles", href: "/category/toys?subcategory=vehicles" },
      { label: "Remote Control", href: "/category/toys?subcategory=remote-control" },
      { label: "Games", href: "/category/toys?subcategory=games" },
      { label: "Outdoor", href: "/category/toys?subcategory=outdoor" },
    ],
  },
  {
    label: "SCHOOL",
    href: "/category/school",
    megaMenu: [
      { label: "Backpacks", href: "/category/school?subcategory=backpacks" },
      { label: "Lunch Boxes", href: "/category/school?subcategory=lunch-boxes" },
      { label: "Water Bottles", href: "/category/school?subcategory=water-bottles" },
      { label: "Stationery", href: "/category/school?subcategory=stationery" },
      { label: "School Accessories", href: "/category/school?subcategory=school-accessories" },
    ],
  },
  { label: "ACCESSORIES", href: "/category/accessories" },
  { label: "NEW ARRIVALS", href: "/products?filter=new-arrivals" },
  { label: "SALE", href: "/products?filter=sale" },
];

export const shopCategories = [
  { label: "Boys", href: "/category/boys", color: "var(--color-brand-blue)" },
  { label: "Girls", href: "/category/girls", color: "var(--color-brand-pink)" },
  { label: "Baby", href: "/category/baby", color: "var(--color-brand-mint)" },
  { label: "Shoes", href: "/category/shoes", color: "var(--color-brand-purple)" },
  { label: "Toys", href: "/category/toys", color: "var(--color-brand-orange)" },
  { label: "School", href: "/category/school", color: "var(--color-brand-teal)" },
  { label: "Accessories", href: "/category/accessories", color: "var(--color-brand-coral)" },
  { label: "Gifts", href: "/category/gifts", color: "var(--color-brand-yellow)" },
];

export const footerLinks = {
  shop: [
    { label: "Boys", href: "/category/boys" },
    { label: "Girls", href: "/category/girls" },
    { label: "Baby", href: "/category/baby" },
    { label: "Shoes", href: "/category/shoes" },
    { label: "Toys", href: "/category/toys" },
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
