function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const sizes = {
  clothing: ["12-18M", "18-24M", "2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"],
  baby: ["0-3M", "3-6M", "6-9M", "6-12M", "9-12M", "12-18M", "18-24M"],
  accessories: ["One Size", "S", "M", "L"],
  gifts: ["One Size"],
};

const colors = [
  "Blue",
  "Red",
  "Green",
  "Pink",
  "Yellow",
  "Navy",
  "White",
  "Black",
  "Purple",
  "Orange",
];

function createProduct({
  id,
  name,
  category,
  subcategory,
  price,
  salePrice = null,
  brand = "Budy Bear",
  featured = false,
  newArrival = false,
  bestSeller = false,
  stock = 25,
  rating = 4.5,
  reviewCount = 12,
}) {
  const imageIndex = (id % 10) + 1;
  return {
    id,
    name,
    slug: slugify(name),
    description: `${name} — premium quality kidswear from Budy Bear, designed for comfort, style, and everyday adventures across Pakistan.`,
    category,
    subcategory,
    price,
    salePrice,
    images: [
      `/images/products/product-${imageIndex}.svg`,
      `/images/products/product-${((id + 3) % 10) + 1}.svg`,
    ],
    sizes: sizes[category] || sizes.clothing,
    colors: colors.slice(0, 3 + (id % 3)),
    stock,
    rating,
    reviewCount,
    brand,
    featured,
    newArrival,
    bestSeller,
  };
}

export const seedCategories = [
  {
    id: "boys",
    name: "Boys",
    slug: "boys",
    description: "Stylish and comfortable clothing for boys.",
    image: "/images/categories/boys.jpg",
    subcategories: ["t-shirts", "shirts", "pants", "shorts", "tracksuits", "jackets"],
  },
  {
    id: "girls",
    name: "Girls",
    slug: "girls",
    description: "Trendy outfits and essentials for girls.",
    image: "/images/categories/girl.jpg",
    subcategories: ["tops", "dresses", "frocks", "pants", "skirts", "jackets"],
  },
  {
    id: "baby",
    name: "Baby",
    slug: "baby",
    description: "Soft and safe products for your little ones.",
    image: "/images/categories/baby.jpg",
    subcategories: ["newborn", "baby-boys", "baby-girls", "rompers", "baby-sets"],
  },
  {
    id: "accessories",
    name: "Accessories",
    slug: "accessories",
    description: "Caps, bags, socks and more.",
    image: "/images/categories/accessories.jpg",
    subcategories: ["caps", "bags", "socks", "hair-accessories", "watches"],
  },
  {
    id: "gifts",
    name: "Gifts",
    slug: "gifts",
    description: "Perfect gift ideas for every occasion.",
    image: "/images/categories/gifts.jpg",
    subcategories: ["gift-sets", "personalized", "occasion-gifts"],
  },
];

export const seedProducts = [];

export const seedCoupons = [
  { id: "c1", code: "WELCOME10", label: "Welcome 10%", discountPercent: 10, minOrder: 2000, active: true },
  { id: "c2", code: "WELCOME15", label: "Welcome 15%", discountPercent: 15, minOrder: 3500, active: true },
];

export const seedBanners = [
  { id: "b1", title: "Hero banner", image: "/images/banners/banner_image_4k.jpeg", href: "/products", active: true },
  { id: "b2", title: "Winter collection", image: "/images/banners/winter-collection.svg", href: "/products?new=true", active: true },
];

const AUTHORS = ["Ayesha K.", "Hassan M.", "Sara R.", "Bilal A.", "Fatima N.", "Omar S."];
const COMMENTS = [
  "Great quality and my child loves wearing it.",
  "Soft fabric and true to size. Will order again.",
  "Arrived quickly and looks just like the photos.",
  "Comfortable for all-day play and everyday wear.",
  "Premium feel without an expensive price.",
  "Colors stayed bright after washing.",
];

export function seedReviewsFor() {
  return [];
}
