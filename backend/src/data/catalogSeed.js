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

export const seedProducts = [
  createProduct({ id: 1, name: "Kids Cotton Graphic T-Shirt", category: "boys", subcategory: "t-shirts", price: 1499, salePrice: 1199, newArrival: true, rating: 4.7, reviewCount: 28 }),
  createProduct({ id: 2, name: "Boys Denim Casual Shirt", category: "boys", subcategory: "shirts", price: 2199, salePrice: 1799, bestSeller: true, rating: 4.6, reviewCount: 19 }),
  createProduct({ id: 3, name: "Boys Stretch Chino Pants", category: "boys", subcategory: "pants", price: 2499, featured: true, rating: 4.5, reviewCount: 14 }),
  createProduct({ id: 4, name: "Boys Summer Cargo Shorts", category: "boys", subcategory: "shorts", price: 1699, salePrice: 1399, rating: 4.4, reviewCount: 22 }),
  createProduct({ id: 5, name: "Boys Active Tracksuit Set", category: "boys", subcategory: "tracksuits", price: 3299, salePrice: 2799, bestSeller: true, rating: 4.8, reviewCount: 31 }),
  createProduct({ id: 6, name: "Boys Lightweight Windbreaker Jacket", category: "boys", subcategory: "jackets", price: 3599, newArrival: true, rating: 4.6, reviewCount: 11 }),
  createProduct({ id: 7, name: "Girls Floral Summer Dress", category: "girls", subcategory: "dresses", price: 2799, salePrice: 2299, featured: true, bestSeller: true, rating: 4.9, reviewCount: 45 }),
  createProduct({ id: 8, name: "Girls Ruffle Top", category: "girls", subcategory: "tops", price: 1599, salePrice: 1299, newArrival: true, rating: 4.5, reviewCount: 17 }),
  createProduct({ id: 9, name: "Girls Party Frock", category: "girls", subcategory: "frocks", price: 3999, salePrice: 3299, rating: 4.7, reviewCount: 26 }),
  createProduct({ id: 10, name: "Girls Slim Fit Leggings", category: "girls", subcategory: "pants", price: 1299, rating: 4.3, reviewCount: 13 }),
  createProduct({ id: 11, name: "Girls Pleated Skirt", category: "girls", subcategory: "skirts", price: 1899, salePrice: 1599, rating: 4.4, reviewCount: 16 }),
  createProduct({ id: 12, name: "Girls Puffer Jacket", category: "girls", subcategory: "jackets", price: 4499, featured: true, rating: 4.8, reviewCount: 20 }),
  createProduct({ id: 13, name: "Baby Cotton Romper", category: "baby", subcategory: "rompers", price: 1499, salePrice: 1199, bestSeller: true, rating: 4.8, reviewCount: 38, stock: 40 }),
  createProduct({ id: 14, name: "Newborn Soft Onesie Set", category: "baby", subcategory: "newborn", price: 1999, newArrival: true, rating: 4.7, reviewCount: 24, stock: 35 }),
  createProduct({ id: 15, name: "Baby Boys Striped Set", category: "baby", subcategory: "baby-boys", price: 2299, salePrice: 1899, rating: 4.6, reviewCount: 18, stock: 30 }),
  createProduct({ id: 16, name: "Baby Girls Floral Set", category: "baby", subcategory: "baby-girls", price: 2299, featured: true, rating: 4.7, reviewCount: 21, stock: 28 }),
  createProduct({ id: 17, name: "Baby Cozy Sleep Set", category: "baby", subcategory: "baby-sets", price: 2599, salePrice: 2199, rating: 4.5, reviewCount: 15, stock: 22 }),
  createProduct({ id: 33, name: "Kids Baseball Cap", category: "accessories", subcategory: "caps", price: 899, salePrice: 749, rating: 4.2, reviewCount: 11, brand: "MiniStyle" }),
  createProduct({ id: 34, name: "Crossbody Mini Bag", category: "accessories", subcategory: "bags", price: 1599, featured: true, rating: 4.5, reviewCount: 19, brand: "MiniStyle" }),
  createProduct({ id: 35, name: "Cotton Ankle Socks Pack", category: "accessories", subcategory: "socks", price: 599, rating: 4.4, reviewCount: 28, brand: "MiniStyle" }),
  createProduct({ id: 36, name: "Hair Accessories Set", category: "accessories", subcategory: "hair-accessories", price: 799, salePrice: 649, newArrival: true, rating: 4.6, reviewCount: 15, brand: "MiniStyle" }),
  createProduct({ id: 37, name: "Kids Digital Watch", category: "accessories", subcategory: "watches", price: 1999, salePrice: 1699, rating: 4.3, reviewCount: 10, brand: "MiniStyle" }),
  createProduct({ id: 38, name: "Birthday Gift Hamper", category: "gifts", subcategory: "gift-sets", price: 4999, salePrice: 4299, featured: true, rating: 4.9, reviewCount: 22, brand: "TinyTrend" }),
  createProduct({ id: 39, name: "Personalized Name Mug", category: "gifts", subcategory: "personalized", price: 1299, rating: 4.5, reviewCount: 9, brand: "TinyTrend" }),
  createProduct({ id: 40, name: "Eid Celebration Gift Box", category: "gifts", subcategory: "occasion-gifts", price: 3499, salePrice: 2999, bestSeller: true, rating: 4.7, reviewCount: 17, brand: "TinyTrend" }),
  createProduct({ id: 41, name: "Boys Polo T-Shirt", category: "boys", subcategory: "t-shirts", price: 1799, rating: 4.4, reviewCount: 20, brand: "LittleStar" }),
  createProduct({ id: 42, name: "Girls Denim Jacket", category: "girls", subcategory: "jackets", price: 3799, salePrice: 3199, newArrival: true, rating: 4.6, reviewCount: 14, brand: "LittleStar" }),
];

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

export function seedReviewsFor(product) {
  const count = Math.min(product.reviewCount, 6);
  return Array.from({ length: count }, (_, index) => ({
    id: `${product.id}-review-${index + 1}`,
    productId: product.id,
    productName: product.name,
    author: AUTHORS[index % AUTHORS.length],
    rating: Math.max(3, Math.min(5, Math.round(product.rating - (index % 2) * 0.3))),
    title: index === 0 ? "Highly recommended" : "Happy with this purchase",
    comment: COMMENTS[index % COMMENTS.length],
    status: "Published",
    created_at: `2026-0${(index % 8) + 1}-${String(12 + index).padStart(2, "0")}`,
  }));
}
