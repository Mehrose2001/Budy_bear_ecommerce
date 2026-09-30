import {
  getProductBySlug as memoryProductBySlug,
  getRelatedProducts as memoryRelatedProducts,
  getSettings as memorySettings,
  listBanners as memoryBanners,
  listCategories as memoryCategories,
  listCoupons as memoryCoupons,
  listProducts as memoryProducts,
  searchCatalog as memorySearch,
} from "@/lib/catalogStore";
import { getReviewsForProduct } from "@/data/reviews";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProducts } from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import { getProductBySlug } from "@/services/productService";
import { getProductReviews } from "@/services/reviewService";
import { listBanners, listCoupons, getStoreSettings } from "@/services/contentService";

const TTL = 15_000;
const inflight = new Map();
let snapshotCache = null;

function memorySnapshot() {
  return {
    source: "memory",
    products: memoryProducts(),
    categories: memoryCategories(),
    banners: memoryBanners().filter((banner) => banner.active),
    coupons: memoryCoupons().filter((coupon) => coupon.active),
    settings: memorySettings(),
  };
}

async function supabaseSnapshot() {
  const [products, categories, banners, coupons, settings] = await Promise.all([
    getProducts(),
    getCategories(),
    listBanners(),
    listCoupons(),
    getStoreSettings(),
  ]);
  return {
    source: "supabase",
    products,
    categories,
    banners,
    coupons,
    settings,
  };
}

export async function getCatalogSnapshot() {
  if (snapshotCache && Date.now() - snapshotCache.at < TTL) {
    return snapshotCache.value;
  }

  if (inflight.has("snapshot")) {
    return inflight.get("snapshot");
  }

  const pending = (async () => {
    if (isSupabaseConfigured()) {
      try {
        const value = await supabaseSnapshot();
        snapshotCache = { at: Date.now(), value };
        return value;
      } catch (error) {
        if (snapshotCache?.value) return snapshotCache.value;
        console.warn("Supabase catalog unavailable; serving local catalog.", error.message);
        return memorySnapshot();
      }
    }
    return memorySnapshot();
  })().finally(() => inflight.delete("snapshot"));

  inflight.set("snapshot", pending);
  return pending;
}

export async function listProducts() {
  const snapshot = await getCatalogSnapshot();
  return snapshot.products;
}

export async function listCategories() {
  const snapshot = await getCatalogSnapshot();
  return snapshot.categories;
}

export async function getNewArrivals() {
  const products = await listProducts();
  return products.filter((product) => product.newArrival);
}

export async function getBestSellers() {
  const products = await listProducts();
  return products.filter((product) => product.bestSeller);
}

export async function getCategoryBySlug(slug) {
  const categories = await listCategories();
  return categories.find((category) => category.slug === slug) || null;
}

export async function getProductsByCategory(category) {
  const products = await listProducts();
  return products.filter((product) => product.category === category);
}

export async function searchCatalog(query) {
  const snapshot = await getCatalogSnapshot();
  if (snapshot.source === "memory") return memorySearch(query);
  const normalizedQuery = String(query || "").toLowerCase().trim();
  if (!normalizedQuery) return snapshot.products;
  return snapshot.products.filter(
    (product) =>
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.subcategory.toLowerCase().includes(normalizedQuery) ||
      product.brand.toLowerCase().includes(normalizedQuery)
  );
}

export async function getProductPage(slug) {
  if (isSupabaseConfigured()) {
    try {
      const product = await getProductBySlug(slug);
      if (!product) return null;
      const [reviews, snapshot] = await Promise.all([
        getProductReviews(product.id),
        getCatalogSnapshot(),
      ]);
      const related = snapshot.products
        .filter(
          (item) =>
            item.id !== product.id &&
            (item.category === product.category || item.subcategory === product.subcategory)
        )
        .slice(0, 8);
      return { product, reviews, related };
    } catch (error) {
      console.warn("Product API unavailable; serving local catalog.", error.message);
    }
  }

  const product = memoryProductBySlug(slug);
  if (!product) return null;
  return {
    product,
    reviews: getReviewsForProduct(product),
    related: memoryRelatedProducts(product),
  };
}

export async function listStoreProducts() {
  return listProducts();
}
