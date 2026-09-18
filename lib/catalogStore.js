import { products as seedProducts } from "@/data/products";
import { categories as seedCategories } from "@/data/categories";
import { getReviewsForProduct } from "@/data/reviews";
import { slugify } from "@/lib/utils";

function cloneProduct(product) {
  return {
    ...product,
    images: [...product.images],
    sizes: [...product.sizes],
    colors: [...product.colors],
  };
}

const CATALOG_SEED_VERSION = "catalog-without-shoes-toys-school";

function getStore() {
  if (
    !globalThis.__budyBearCatalog ||
    globalThis.__budyBearCatalog.seedVersion !== CATALOG_SEED_VERSION
  ) {
    const products = seedProducts.map(cloneProduct);
    globalThis.__budyBearCatalog = {
      seedVersion: CATALOG_SEED_VERSION,
      products,
      categories: seedCategories.map((category) => ({
        ...category,
        subcategories: [...category.subcategories],
      })),
      coupons: [
        {
          id: "c1",
          code: "WELCOME10",
          label: "Welcome 10%",
          discountPercent: 10,
          minOrder: 2000,
          active: true,
        },
        {
          id: "c2",
          code: "WELCOME15",
          label: "Welcome 15%",
          discountPercent: 15,
          minOrder: 3500,
          active: true,
        },
      ],
      banners: [
        {
          id: "b1",
          title: "Hero banner",
          image: "/images/banners/hero-banner.jpg",
          href: "/products",
          active: true,
        },
        {
          id: "b2",
          title: "Winter collection",
          image: "/images/banners/winter-collection.svg",
          href: "/products?new=true",
          active: true,
        },
      ],
      reviews: products.flatMap((product) =>
        getReviewsForProduct(product).map((review) => ({
          ...review,
          productId: product.id,
          productName: product.name,
          status: "Published",
        }))
      ),
      nextProductId: Math.max(...products.map((product) => product.id)) + 1,
      settings: {
        storeName: "Budy Bear",
        announcement: "Free Delivery on Orders Above Rs. 3,000",
        supportEmail: "hello@budybear.pk",
        supportPhone: "021-111-283-927",
      },
    };
  }

  return globalThis.__budyBearCatalog;
}

export function listProducts() {
  return getStore().products;
}

export function getProductById(id) {
  return getStore().products.find((product) => product.id === Number(id));
}

export function getProductBySlug(slug) {
  return getStore().products.find((product) => product.slug === slug);
}

export function getProductsByCategory(category) {
  return getStore().products.filter((product) => product.category === category);
}

export function getCategoryBySlug(slug) {
  return getStore().categories.find((category) => category.slug === slug);
}

export function getRelatedProducts(product, limit = 8) {
  return getStore()
    .products.filter((item) => {
      if (item.id === product.id) return false;
      return (
        item.category === product.category ||
        item.subcategory === product.subcategory
      );
    })
    .slice(0, limit);
}

export function getNewArrivals() {
  return getStore().products.filter((product) => product.newArrival);
}

export function getBestSellers() {
  return getStore().products.filter((product) => product.bestSeller);
}

export function searchCatalog(query) {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return listProducts();

  return listProducts().filter((product) => {
    return (
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.subcategory.toLowerCase().includes(normalizedQuery) ||
      product.brand.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function createProduct(input) {
  const store = getStore();
  const product = {
    id: store.nextProductId++,
    name: input.name,
    slug: input.slug || slugify(input.name),
    description: input.description || "",
    category: input.category,
    subcategory: input.subcategory || "",
    price: Number(input.price) || 0,
    salePrice: input.salePrice ? Number(input.salePrice) : null,
    images: input.images?.length
      ? input.images
      : ["/images/products/product-1.svg"],
    colorImages: input.colorImages || [],
    colorSwatches: input.colorSwatches || {},
    sizes: input.sizes?.length ? input.sizes : ["One Size"],
    colors: input.colors?.length ? input.colors : ["Navy"],
    stock: Number(input.stock) || 0,
    rating: Number(input.rating) || 5,
    reviewCount: Number(input.reviewCount) || 0,
    brand: input.brand || "Budy Bear",
    featured: Boolean(input.featured),
    newArrival: Boolean(input.newArrival),
    bestSeller: Boolean(input.bestSeller),
  };

  store.products.unshift(product);
  return product;
}

export function updateProduct(id, input) {
  const store = getStore();
  const index = store.products.findIndex((product) => product.id === Number(id));
  if (index === -1) return null;

  store.products[index] = {
    ...store.products[index],
    ...input,
    id: store.products[index].id,
    price: Number(input.price ?? store.products[index].price),
    salePrice:
      input.salePrice === "" || input.salePrice == null
        ? null
        : Number(input.salePrice),
    stock: Number(input.stock ?? store.products[index].stock),
    colorImages: input.colorImages ?? store.products[index].colorImages ?? [],
    colorSwatches: input.colorSwatches ?? store.products[index].colorSwatches ?? {},
  };

  return store.products[index];
}

export function deleteProduct(id) {
  const store = getStore();
  const index = store.products.findIndex((product) => product.id === Number(id));
  if (index === -1) return false;
  store.products.splice(index, 1);
  return true;
}

export function listCategories() {
  return getStore().categories;
}

export function upsertCategory(input) {
  const store = getStore();
  const existing = store.categories.find(
    (category) => category.slug === input.slug || category.id === input.id
  );

  if (existing) {
    Object.assign(existing, {
      name: input.name,
      description: input.description,
      subcategories: input.subcategories || existing.subcategories,
    });
    return existing;
  }

  const category = {
    id: input.slug,
    name: input.name,
    slug: input.slug,
    description: input.description || "",
    image: "/images/categories/gifts.svg",
    subcategories: input.subcategories || [],
  };
  store.categories.push(category);
  return category;
}

export function deleteCategory(slug) {
  const store = getStore();
  store.categories = store.categories.filter((category) => category.slug !== slug);
}

export function listCoupons() {
  return getStore().coupons;
}

export function upsertCoupon(input) {
  const store = getStore();
  const existing = store.coupons.find((coupon) => coupon.id === input.id);
  if (existing) {
    Object.assign(existing, input);
    return existing;
  }
  const coupon = { id: `c${Date.now()}`, active: true, ...input };
  store.coupons.unshift(coupon);
  return coupon;
}

export function deleteCoupon(id) {
  const store = getStore();
  store.coupons = store.coupons.filter((coupon) => coupon.id !== id);
}

export function listBanners() {
  return getStore().banners;
}

export function upsertBanner(input) {
  const store = getStore();
  const existing = store.banners.find((banner) => banner.id === input.id);
  if (existing) {
    Object.assign(existing, input);
    return existing;
  }
  const banner = { id: `b${Date.now()}`, active: true, ...input };
  store.banners.unshift(banner);
  return banner;
}

export function deleteBanner(id) {
  const store = getStore();
  store.banners = store.banners.filter((banner) => banner.id !== id);
}

export function listReviews() {
  return getStore().reviews;
}

export function updateReview(id, input) {
  const review = getStore().reviews.find((item) => item.id === id);
  if (!review) return null;
  Object.assign(review, input);
  return review;
}

export function deleteReview(id) {
  const store = getStore();
  store.reviews = store.reviews.filter((review) => review.id !== id);
}

export function getSettings() {
  return getStore().settings;
}

export function updateSettings(input) {
  const store = getStore();
  store.settings = { ...store.settings, ...input };
  return store.settings;
}
