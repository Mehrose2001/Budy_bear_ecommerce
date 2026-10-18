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

export const products = [];

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
