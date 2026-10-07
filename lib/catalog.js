import {
  getProductBySlug as memoryProductBySlug,
  getRelatedProducts as memoryRelatedProducts,
  getSettings as memorySettings,
  listBanners as memoryBanners,
  listCategories as memoryCategories,
  listCoupons as memoryCoupons,
  listProducts as memoryProducts,
  listReviews as memoryReviews,
  searchCatalog as memorySearch,
} from "@/lib/catalogStore";
import { getReviewsForProduct } from "@/data/reviews";
import { isTestimonialReview, TESTIMONIAL_LIMIT } from "@/lib/reviewStatus";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProducts, getProductBySlug, getRelatedProducts } from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import { getProductReviews, getTestimonialReviews } from "@/services/reviewService";
import { listBanners, listCoupons, getStoreSettings, getStorePage } from "@/services/contentService";
import { getDefaultLegalPage, mergeLegalPage } from "@/data/legalPages";

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

export function invalidateCatalogSnapshot() {
  snapshotCache = null;
  inflight.clear();
}

export async function listProducts() {
  const snapshot = await getCatalogSnapshot();
  return snapshot.products;
}

export async function listCategories() {
  if (isSupabaseConfigured()) {
    try {
      return (await getCategories()).filter(Boolean);
    } catch (error) {
      console.warn("Live categories unavailable; using catalog snapshot.", error.message);
    }
  }
  const snapshot = await getCatalogSnapshot();
  return (snapshot.categories || []).filter(Boolean);
}

function isAdminUploadedBanner(banner) {
  const image = String(banner?.image || "");
  if (!image || banner?.active === false) return false;
  return !image.includes("banner_image_4k");
}

export async function listStoreBanners() {
  if (isSupabaseConfigured()) {
    try {
      return (await listBanners()).filter(isAdminUploadedBanner);
    } catch (error) {
      console.warn("Live banners unavailable; using catalog snapshot.", error.message);
    }
  }
  const snapshot = await getCatalogSnapshot();
  return (snapshot.banners || []).filter(isAdminUploadedBanner);
}

export async function getNewArrivals() {
  const products = await listProducts();
  return products.filter((product) => product.newArrival);
}

export async function getStorefrontSettings() {
  const snapshot = await getCatalogSnapshot();
  return snapshot.settings;
}

export async function getLegalPage(slug) {
  if (isSupabaseConfigured()) {
    try {
      const page = await getStorePage(slug);
      if (page) return page;
    } catch (error) {
      console.warn("Live legal page unavailable.", error.message);
    }
  }
  return mergeLegalPage(slug, memorySettings()?.legalPages?.[slug]) || getDefaultLegalPage(slug);
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

export async function listStoreTestimonials() {
  if (isSupabaseConfigured()) {
    try {
      return await getTestimonialReviews();
    } catch (error) {
      console.warn("Live testimonials unavailable.", error.message);
    }
  }
  return memoryReviews()
    .filter(isTestimonialReview)
    .slice(0, TESTIMONIAL_LIMIT);
}

export async function getProductPage(slug) {
  if (isSupabaseConfigured()) {
    try {
      const product = await getProductBySlug(slug);
      if (!product) return null;
      const [reviews, related] = await Promise.all([
        getProductReviews(product.id),
        getRelatedProducts(product),
      ]);
      return { product, reviews, related, live: true };
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
    live: false,
  };
}

export async function listStoreProducts() {
  return listProducts();
}
