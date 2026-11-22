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
import { isLiveBackendConfigured, liveBackendName } from "@/lib/backendMode";
import { getProducts, getProductBySlug, getRelatedProducts } from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import { getProductReviews, getTestimonialReviews, invalidateReviewStatsCache } from "@/services/reviewService";
import { applyReviewStatsToProduct } from "@/lib/ratings";
import { listBanners, listCoupons, getStoreSettings, getStorePage } from "@/services/contentService";
import { getDefaultLegalPage, mergeLegalPage } from "@/data/legalPages";
import { subcategorySearchText } from "@/lib/productSubcategories";
import { cache } from "react";

const TTL = 15_000;
const FETCH_MS = 8_000;
const inflight = new Map();
let snapshotCache = null;

function withTimeout(promise, ms = FETCH_MS) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("Catalog request timed out.")), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

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
    source: liveBackendName(),
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
    if (isLiveBackendConfigured()) {
      try {
        const value = await withTimeout(supabaseSnapshot());
        snapshotCache = { at: Date.now(), value };
        return value;
      } catch (error) {
        if (snapshotCache?.value) return snapshotCache.value;
        console.warn("Catalog unavailable; serving local catalog.", error.message);
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
  invalidateReviewStatsCache();
}

export async function listProducts() {
  const snapshot = await getCatalogSnapshot();
  return snapshot.products;
}

export async function listCategories() {
  if (isLiveBackendConfigured()) {
    try {
      return (await withTimeout(getCategories())).filter(Boolean);
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
  if (isLiveBackendConfigured()) {
    try {
      return (await withTimeout(listBanners())).filter(isAdminUploadedBanner);
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

let lastLiveSettings = null;

function rememberSettings(settings) {
  if (settings?.seo) lastLiveSettings = settings;
  return settings;
}

async function loadLiveSettings() {
  const pending = getStoreSettings().then(rememberSettings);
  try {
    return await withTimeout(pending, 12_000);
  } catch (error) {
    if (lastLiveSettings) return lastLiveSettings;
    try {
      return rememberSettings(await withTimeout(getStoreSettings(), 12_000));
    } catch (retryError) {
      console.warn("Live settings unavailable; using the last saved storefront settings.", retryError.message || error.message);
      return lastLiveSettings;
    }
  }
}

async function readStorefrontSettings() {
  if (isLiveBackendConfigured()) {
    const settings = await loadLiveSettings();
    if (settings) return settings;
    if (lastLiveSettings) return lastLiveSettings;
    return null;
  }
  const snapshot = await getCatalogSnapshot();
  return snapshot.settings;
}

export const getStorefrontSettings = cache(readStorefrontSettings);

export async function getLegalPage(slug) {
  if (isLiveBackendConfigured()) {
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
  const featured = products.filter((product) => product.featured);
  const pool = featured.length ? featured : products;
  return [...pool].sort(
    (a, b) => Number(b.reviewCount || 0) - Number(a.reviewCount || 0)
  );
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
      subcategorySearchText(product).includes(normalizedQuery) ||
      product.brand.toLowerCase().includes(normalizedQuery)
  );
}

export async function listStoreTestimonials() {
  if (isLiveBackendConfigured()) {
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

export const getProductPage = cache(async function getProductPage(slug) {
  if (isLiveBackendConfigured()) {
    try {
      const product = await getProductBySlug(slug);
      if (!product) return null;
      const [reviews, related] = await Promise.all([
        getProductReviews(product.id).catch((error) => {
          console.warn("Product reviews unavailable.", error.message);
          return [];
        }),
        getRelatedProducts(product).catch((error) => {
          console.warn("Related products unavailable.", error.message);
          return [];
        }),
      ]);
      return {
        product: applyReviewStatsToProduct(product, reviews),
        reviews,
        related,
        live: true,
      };
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
});

export async function listStoreProducts() {
  return listProducts();
}
