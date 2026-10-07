import { config } from "../config.js";
import { cached, invalidateCatalogCache } from "../lib/cache.js";
import { HttpError } from "../lib/http.js";
import {
  mapBanner,
  mapCategory,
  mapCoupon,
  mapProduct,
  mapReview,
  mapSettings,
  productToRow,
} from "../lib/map.js";
import { requireSupabase } from "../supabase.js";
import { getDefaultLegalPage, mergeLegalPage } from "../../../data/legalPages.js";

async function fetchAll(table, orderColumn = "id") {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(orderColumn, { ascending: true });
  if (error) throw new HttpError(500, `Unable to load ${table}.`);
  return data || [];
}

export async function getSnapshot() {
  return cached("catalog:snapshot", config.catalogCacheMs, async () => {
    const [products, categories, banners, coupons, settingsRows, reviews] =
      await Promise.all([
        fetchAll("products", "id"),
        fetchAll("categories", "name"),
        fetchAll("banners", "created_at"),
        fetchAll("coupons", "created_at"),
        fetchAll("store_settings", "id"),
        fetchAll("reviews", "created_at"),
      ]);

    return {
      source: "supabase",
      products: products.map(mapProduct),
      categories: categories.map(mapCategory),
      banners: banners.map(mapBanner),
      coupons: coupons.map(mapCoupon),
      settings: mapSettings(settingsRows[0]),
      reviews: reviews.map(mapReview),
    };
  });
}

export async function listProducts() {
  const snapshot = await getSnapshot();
  return snapshot.products;
}

export async function getProductBySlug(slug) {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new HttpError(500, "Unable to load product.");
  return mapProduct(data);
}

export async function getProductById(id) {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle();
  if (error) throw new HttpError(500, "Unable to load product.");
  return mapProduct(data);
}

export async function listPublishedReviews(productId) {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", Number(productId))
    .or("is_approved.eq.true,is_testimonial.eq.true,status.eq.Published,status.eq.Testimonial")
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(500, "Unable to load reviews.");
  return (data || []).map(mapReview);
}

export async function createProduct(input) {
  const supabase = await requireSupabase();
  const row = productToRow(input);
  const { data: nextId, error: seqError } = await supabase.rpc("next_product_id");
  let id = Number(nextId);
  if (seqError || !Number.isFinite(id)) {
    const { data: rows } = await supabase
      .from("products")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);
    id = Number(rows?.[0]?.id || 100) + 1;
  }
  const { data, error } = await supabase
    .from("products")
    .insert({ id, ...row })
    .select("*")
    .single();
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
  return mapProduct(data);
}

export async function updateProduct(id, input) {
  const existing = await getProductById(id);
  if (!existing) throw new HttpError(404, "Product not found");
  const supabase = await requireSupabase();
  const row = productToRow(input, {
    ...existing,
    category_id: existing.category,
    sale_price: existing.salePrice,
    color_images: existing.colorImages,
    color_swatches: existing.colorSwatches,
    new_arrival: existing.newArrival,
    best_seller: existing.bestSeller,
    review_count: existing.reviewCount,
  });
  const { data, error } = await supabase
    .from("products")
    .update(row)
    .eq("id", Number(id))
    .select("*")
    .single();
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
  return mapProduct(data);
}

export async function deleteProduct(id) {
  const supabase = await requireSupabase();
  const { error } = await supabase.from("products").delete().eq("id", Number(id));
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
}

export async function upsertCategory(input) {
  const supabase = await requireSupabase();
  const row = {
    id: input.id || input.slug,
    name: input.name,
    slug: input.slug,
    description: input.description || "",
    image: input.image,
    subcategories: input.subcategories || [],
  };
  const { data, error } = await supabase
    .from("categories")
    .upsert(row)
    .select("*")
    .single();
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
  return mapCategory(data);
}

export async function deleteCategory(slug) {
  const supabase = await requireSupabase();
  const { error } = await supabase.from("categories").delete().eq("slug", slug);
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
}

export async function upsertCoupon(input) {
  const supabase = await requireSupabase();
  const row = {
    id: input.id || `c${Date.now()}`,
    code: String(input.code || "").toUpperCase(),
    label: input.label,
    discount_percent: Number(input.discountPercent ?? input.discount_percent),
    min_order: Number(input.minOrder ?? input.min_order ?? 0),
    active: input.active !== false,
  };
  const { data, error } = await supabase.from("coupons").upsert(row).select("*").single();
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
  return mapCoupon(data);
}

export async function deleteCoupon(id) {
  const supabase = await requireSupabase();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
}

export async function upsertBanner(input) {
  const supabase = await requireSupabase();
  const row = {
    id: input.id || `b${Date.now()}`,
    title: input.title,
    image: input.image,
    href: input.href || "/products",
    active: input.active !== false,
  };
  const { data, error } = await supabase.from("banners").upsert(row).select("*").single();
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
  return mapBanner(data);
}

export async function deleteBanner(id) {
  const supabase = await requireSupabase();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
}

export async function updateReview(id, input) {
  const supabase = await requireSupabase();
  const patch = {
    title: input.title,
    comment: input.comment,
    rating: input.rating,
  };
  if (input.status) {
    const isTestimonial = /testimonial/i.test(String(input.status));
    patch.status = isTestimonial || input.status === "Published" ? "Published" : input.status;
    if (!["Published", "Hidden", "Pending"].includes(patch.status)) {
      patch.status = "Published";
    }
    patch.is_approved = input.status === "Published" || isTestimonial;
    patch.is_testimonial = isTestimonial;
  }
  let { data, error } = await supabase
    .from("reviews")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error && /is_testimonial|reviews_status_check/i.test(error.message || "")) {
    delete patch.is_testimonial;
    patch.status = "Published";
    const current = await supabase.from("reviews").select("comment").eq("id", id).maybeSingle();
    const marker = "[[bb-testimonial]]";
    const base = String(current.data?.comment || patch.comment || "").replace(/\s*\[\[bb-testimonial\]\]\s*/g, "").trim();
    patch.comment = /testimonial/i.test(String(input.status))
      ? `${base}\n\n${marker}`
      : base;
    ({ data, error } = await supabase.from("reviews").update(patch).eq("id", id).select("*").single());
  }
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
  return mapReview(data);
}

export async function deleteReview(id) {
  const supabase = await requireSupabase();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
}

export async function updateSettings(input) {
  const supabase = await requireSupabase();
  const payload = {
    store_name: input.storeName ?? input.store_name,
    announcement: input.announcement,
    support_email: input.supportEmail ?? input.support_email,
    support_phone: input.supportPhone ?? input.support_phone,
    seasonal_collection:
      String(input.seasonalCollection ?? input.seasonal_collection || "").toLowerCase() === "summer"
        ? "summer"
        : "winter",
  };
  const { data, error } = await supabase
    .from("store_settings")
    .update(payload)
    .eq("id", 1)
    .select("*")
    .single();
  if (error && /seasonal_collection/i.test(String(error.message || ""))) {
    const { seasonal_collection: _season, ...legacy } = payload;
    const retry = await supabase
      .from("store_settings")
      .update(legacy)
      .eq("id", 1)
      .select("*")
      .single();
    if (retry.error) throw new HttpError(400, retry.error.message);
    invalidateCatalogCache();
    return {
      ...mapSettings(retry.data),
      seasonalCollection: payload.seasonal_collection,
    };
  }
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
  return mapSettings(data);
}

export async function getStorePage(slug) {
  const defaults = getDefaultLegalPage(slug);
  if (!defaults) throw new HttpError(400, "Unknown page.");
  const supabase = await requireSupabase();
  const settings = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  const fromSettings = mapSettings(settings.data).legalPages?.[slug];
  if (String(fromSettings?.intro || "").trim() || String(fromSettings?.body || "").trim()) {
    return mergeLegalPage(slug, fromSettings);
  }
  const fromTable = await supabase.from("store_pages").select("*").eq("slug", slug).maybeSingle();
  if (!fromTable.error && fromTable.data) {
    return mergeLegalPage(slug, fromTable.data);
  }
  return mergeLegalPage(slug, fromSettings);
}

export async function upsertStorePage(input) {
  const slug = String(input.slug || "");
  const defaults = getDefaultLegalPage(slug);
  if (!defaults) throw new HttpError(400, "Unknown page.");
  const row = {
    slug,
    title: defaults.title,
    intro: String(input.intro ?? ""),
    body: String(input.body ?? ""),
  };
  const supabase = await requireSupabase();
  const current = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  const legalPages = {
    ...(mapSettings(current.data).legalPages || {}),
    [slug]: { intro: row.intro, body: row.body },
  };
  const jsonSave = await supabase
    .from("store_settings")
    .update({ legal_pages: legalPages })
    .eq("id", 1)
    .select("*")
    .single();
  const saved = await supabase.from("store_pages").upsert(row).select("*").single();
  if (!jsonSave.error || !saved.error) {
    invalidateCatalogCache();
    return mergeLegalPage(slug, row);
  }
  throw new HttpError(
    400,
    "Unable to save page. Run backend/sql/012_store_pages.sql in the Supabase SQL editor."
  );
}

export async function listWishlist(userId) {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("wishlists")
    .select("product_id, products(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(500, "Unable to load wishlist.");
  return (data || []).map((row) => mapProduct(row.products)).filter(Boolean);
}

export async function addWishlist(userId, productId) {
  const supabase = await requireSupabase();
  const { error } = await supabase
    .from("wishlists")
    .upsert({ user_id: userId, product_id: Number(productId) });
  if (error) throw new HttpError(400, error.message);
  return listWishlist(userId);
}

export async function removeWishlist(userId, productId) {
  const supabase = await requireSupabase();
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", Number(productId));
  if (error) throw new HttpError(400, error.message);
  return listWishlist(userId);
}

export async function validateCoupon(code, subtotal) {
  const snapshot = await getSnapshot();
  const normalized = String(code || "").trim().toUpperCase();
  const coupon = snapshot.coupons.find(
    (item) => item.active && item.code.toUpperCase() === normalized
  );
  if (!coupon) throw new HttpError(400, "This coupon code is not valid.");
  const amount = Number(subtotal || 0);
  if (amount < coupon.minOrder) {
    throw new HttpError(
      400,
      `This coupon needs a minimum order of Rs. ${coupon.minOrder}.`
    );
  }
  const discount = Math.round(amount * (coupon.discountPercent / 100));
  return { coupon, discount };
}

export async function submitReview(input, userId = null) {
  const rating = Number(input.rating);
  if (!input.productId || !input.author?.trim() || !input.comment?.trim()) {
    throw new HttpError(400, "Please add your name, rating, and review.");
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, "Choose a rating from 1 to 5.");
  }
  if (String(input.comment).trim().length < 8) {
    throw new HttpError(400, "Please write a short review.");
  }
  const supabase = await requireSupabase();
  const { data, error } = await supabase.rpc("submit_review", {
    p_product_id: Number(input.productId),
    p_author: input.author.trim(),
    p_rating: rating,
    p_title: input.title?.trim() || "Customer review",
    p_comment: input.comment.trim(),
    p_user_id: userId || null,
  });
  if (error) throw new HttpError(400, error.message);
  invalidateCatalogCache();
  return mapReview(data);
}
