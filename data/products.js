import { slugify } from "@/lib/utils";

const brands = ["Budy Bear", "LittleStar", "PlayJoy", "MiniStyle", "TinyTrend"];
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
  const slug = slugify(name);
  const imageIndex = (id % 10) + 1;

  return {
    id,
    name,
    slug,
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

export const products = [
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

export function getProductBySlug(slug) {
  return products.find((product) => product.slug === slug);
}

export function getProductById(id) {
  return products.find((product) => product.id === Number(id));
}

export function getProductsByCategory(category) {
  return products.filter((product) => product.category === category);
}

export function getFeaturedProducts() {
  return products.filter((product) => product.featured);
}

export function getNewArrivals() {
  return products.filter((product) => product.newArrival);
}

export function getBestSellers() {
  return products.filter((product) => product.bestSeller);
}

export function getSaleProducts() {
  return products.filter(
    (product) => product.salePrice && product.salePrice < product.price
  );
}

export function getRelatedProducts(product, limit = 8) {
  return products
    .filter((item) => {
      if (item.id === product.id) return false;
      return (
        item.category === product.category ||
        item.subcategory === product.subcategory
      );
    })
    .slice(0, limit);
}

export function searchProducts(query) {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  return products.filter((product) => {
    return (
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.subcategory.toLowerCase().includes(normalizedQuery) ||
      product.brand.toLowerCase().includes(normalizedQuery)
    );
  });
}
