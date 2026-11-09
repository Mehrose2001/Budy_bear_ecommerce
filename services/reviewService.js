import { AppError, throwIf } from "@/lib/errors";
import { mapReview } from "@/lib/mappers";
import { statsFromReviewRows } from "@/lib/ratings";
import {
  REVIEW_STATUS,
  TESTIMONIAL_LIMIT,
  isHomepageTestimonialRow,
  isReviewPublicRow,
  wantsTestimonialStatus,
  withTestimonialMarker,
} from "@/lib/reviewStatus";
import {
  createServerClient,
  createServiceClient,
  createUserClient,
} from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAccessTokenFresh } from "@/lib/adminSession";

function anonClient() {
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase is not configured.", 503);
  }
  return createServerClient();
}

function writeClient(accessToken) {
  if (createServiceClient()) return createServiceClient();
  if (isAccessTokenFresh(accessToken)) return createUserClient(accessToken);
  return anonClient();
}

function isMissingColumnError(error, column) {
  const message = String(error?.message || error?.details || "");
  return message.toLowerCase().includes(column.toLowerCase());
}

let reviewStatsCache = { at: 0, map: new Map() };
const REVIEW_STATS_TTL_MS = 20_000;

export async function loadPublicReviewStatsMap() {
  if (!isSupabaseConfigured()) return new Map();
  if (Date.now() - reviewStatsCache.at < REVIEW_STATS_TTL_MS) {
    return reviewStatsCache.map;
  }
  const supabase = createServiceClient() || anonClient();
  let { data, error } = await supabase
    .from("reviews")
    .select("product_id, rating, status, is_approved, is_testimonial, comment");
  if (error && isMissingColumnError(error, "is_testimonial")) {
    ({ data, error } = await supabase
      .from("reviews")
      .select("product_id, rating, status, is_approved, comment"));
  }
  if (error) {
    if (reviewStatsCache.map.size > 0) return reviewStatsCache.map;
    return new Map();
  }
  const map = statsFromReviewRows(data || []);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, rating, review_count");
  if (!productsError) {
    for (const row of products || []) {
      const productId = Number(row.id);
      const reviewCount = Math.max(0, Number(row.review_count ?? 0));
      if (!productId || reviewCount <= 0) continue;
      const rating = Number(row.rating) || 0;
      const fromReviews = map.get(productId);
      if (!fromReviews || fromReviews.reviewCount < reviewCount) {
        map.set(productId, {
          reviewCount,
          rating: fromReviews?.rating || rating,
        });
      }
    }
  }
  reviewStatsCache = { at: Date.now(), map };
  return map;
}

export function invalidateReviewStatsCache() {
  reviewStatsCache = { at: 0, map: new Map() };
}

export async function getProductReviews(productId, { includeUnapproved = false } = {}) {
  const supabase = anonClient();
  const id = Number(productId);
  if (!id) return [];

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", id)
    .order("created_at", { ascending: false });

  throwIf(error, "Unable to load reviews.", 500);

  const rows = (data || []).filter((row) => (includeUnapproved ? true : isReviewPublicRow(row)));
  return rows.map(mapReview).filter(Boolean);
}

export async function getTestimonialReviews({ limit = TESTIMONIAL_LIMIT } = {}) {
  const supabase = anonClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(120);

  throwIf(error, "Unable to load testimonials.", 500);

  return (data || [])
    .filter((row) => isHomepageTestimonialRow(row))
    .slice(0, limit)
    .map(mapReview)
    .filter(Boolean);
}

export async function getAllReviews(accessToken) {
  const supabase = writeClient(accessToken);
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  throwIf(error, "Unable to load reviews.", 500);
  return (data || []).map(mapReview);
}

async function refreshProductReviewStats(supabase, productId) {
  const id = Number(productId);
  if (!id) return;
  const { data, error } = await supabase
    .from("reviews")
    .select("product_id, rating, status, is_approved, is_testimonial, comment")
    .eq("product_id", id);
  if (error) return;
  const stats = statsFromReviewRows(data || []).get(id) || { review_count: 0, rating: 0, reviewCount: 0 };
  const review_count = stats.reviewCount ?? stats.review_count ?? 0;
  const rating = stats.rating ?? 0;
  await supabase.from("products").update({ review_count, rating }).eq("id", id);
  invalidateReviewStatsCache();
}

export async function createReview(input) {
  const author = String(input.author || input.customerName || "").trim();
  const comment = String(input.comment || "").trim();
  const title = String(input.title || "").trim() || "Customer review";
  const rating = Number(input.rating);
  const productId = Number(input.productId);

  if (!productId || author.length < 2 || comment.length < 8) {
    throw new AppError("Please add your name, rating, and a short review.", 400);
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new AppError("Choose a rating from 1 to 5 stars.", 400);
  }

  const service = createServiceClient();
  const supabase = service || anonClient();

  if (service) {
    const row = {
      id: globalThis.crypto?.randomUUID?.() || `r${Date.now()}`,
      product_id: productId,
      product_name: input.productName || null,
      author,
      customer_name: author,
      user_id: input.userId || null,
      rating,
      title,
      comment,
      status: REVIEW_STATUS.PENDING,
      is_approved: false,
      is_testimonial: false,
    };
    const inserted = await service.from("reviews").insert(row).select("*").maybeSingle();
    if (!inserted.error && inserted.data) {
      await refreshProductReviewStats(service, productId);
      return mapReview(inserted.data);
    }
    if (inserted.error && isMissingColumnError(inserted.error, "is_testimonial")) {
      delete row.is_testimonial;
      const retry = await service.from("reviews").insert(row).select("*").maybeSingle();
      if (!retry.error && retry.data) {
        await refreshProductReviewStats(service, productId);
        return mapReview(retry.data);
      }
    }
  }

  const rpc = await supabase.rpc("submit_review", {
    p_product_id: productId,
    p_author: author,
    p_rating: rating,
    p_title: title,
    p_comment: comment,
    p_user_id: input.userId || null,
  });
  if (!rpc.error && rpc.data) {
    invalidateReviewStatsCache();
    return mapReview(rpc.data);
  }

  const message = String(rpc.error?.message || "");
  if (/jwt expired/i.test(message)) {
    throw new AppError("Please sign in again, or submit the review without signing in.", 401);
  }
  throwIf(rpc.error, "Unable to save review.");
}

async function enforceTestimonialLimit(supabase, keepId) {
  const listed = await supabase
    .from("reviews")
    .select("id, created_at")
    .eq("is_testimonial", true)
    .order("created_at", { ascending: false });

  let rows = listed.data;
  if (listed.error && isMissingColumnError(listed.error, "is_testimonial")) {
    const all = await supabase.from("reviews").select("id, created_at, comment, is_testimonial").order("created_at", {
      ascending: false,
    });
    rows = (all.data || []).filter((row) => isHomepageTestimonialRow(row));
  }

  const extras = (rows || []).filter((row) => row.id !== keepId).slice(TESTIMONIAL_LIMIT - 1);
  if (!extras.length) return;

  const extraIds = extras.map((row) => row.id);
  const cleared = await supabase
    .from("reviews")
    .update({ is_testimonial: false, status: REVIEW_STATUS.PUBLISHED, is_approved: true })
    .in("id", extraIds);
  if (!cleared.error) return;

  const extraRows = await supabase.from("reviews").select("id, comment").in("id", extraIds);
  for (const row of extraRows.data || []) {
    await supabase
      .from("reviews")
      .update({
        status: REVIEW_STATUS.PUBLISHED,
        is_approved: true,
        comment: withTestimonialMarker(row.comment, false),
      })
      .eq("id", row.id);
  }
}

function dbStatus(status) {
  if (wantsTestimonialStatus(status)) return REVIEW_STATUS.PUBLISHED;
  if (status === REVIEW_STATUS.PUBLISHED) return REVIEW_STATUS.PUBLISHED;
  if (status === REVIEW_STATUS.HIDDEN) return REVIEW_STATUS.HIDDEN;
  if (status === REVIEW_STATUS.PENDING) return REVIEW_STATUS.PENDING;
  return REVIEW_STATUS.PUBLISHED;
}

function reviewStatusPatch(status) {
  const featured = wantsTestimonialStatus(status);
  const published = featured || status === REVIEW_STATUS.PUBLISHED;
  return {
    status: dbStatus(status),
    is_approved: published,
    is_testimonial: featured,
  };
}

export async function updateReview(id, input, accessToken) {
  const supabase = writeClient(accessToken);
  const featured = wantsTestimonialStatus(input.status);
  const patch = {};
  if (input.status) Object.assign(patch, reviewStatusPatch(input.status));
  if (input.isApproved != null && !input.status) {
    patch.is_approved = Boolean(input.isApproved);
    patch.status = input.isApproved ? REVIEW_STATUS.PUBLISHED : REVIEW_STATUS.HIDDEN;
    patch.is_testimonial = false;
  }
  if (input.comment != null) patch.comment = input.comment;
  if (input.title != null) patch.title = input.title;
  if (input.rating != null) patch.rating = Number(input.rating);

  let { data, error } = await supabase
    .from("reviews")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  const needsMarkerFallback =
    error &&
    (isMissingColumnError(error, "is_testimonial") ||
      /reviews_status_check/i.test(String(error.message || "")));

  if (needsMarkerFallback) {
    const current = await supabase.from("reviews").select("*").eq("id", id).maybeSingle();
    const fallback = {
      status: dbStatus(input.status || current.data?.status),
      is_approved: featured || input.status === REVIEW_STATUS.PUBLISHED || Boolean(input.isApproved),
      comment: withTestimonialMarker(
        input.comment ?? current.data?.comment,
        featured
      ),
    };
    if (input.title != null) fallback.title = input.title;
    if (input.rating != null) fallback.rating = Number(input.rating);
    ({ data, error } = await supabase
      .from("reviews")
      .update(fallback)
      .eq("id", id)
      .select("*")
      .maybeSingle());
  }

  throwIf(error, "Unable to update review.");
  if (!data) throw new AppError("Review not found", 404);

  if (featured) {
    await enforceTestimonialLimit(supabase, data.id);
  }

  await refreshProductReviewStats(supabase, data.product_id);
  return mapReview(data);
}

export async function deleteReview(id, accessToken) {
  const supabase = writeClient(accessToken);
  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id)
    .select("product_id, product_name")
    .maybeSingle();
  throwIf(error, "Unable to delete review.");
  if (data?.product_id) {
    await refreshProductReviewStats(supabase, data.product_id);
  }
  invalidateReviewStatsCache();
  return data
    ? { product_id: data.product_id, productId: Number(data.product_id) }
    : true;
}
