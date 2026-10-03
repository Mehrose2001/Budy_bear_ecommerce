import { AppError, throwIf } from "@/lib/errors";
import { mapReview } from "@/lib/mappers";
import {
  REVIEW_STATUS,
  TESTIMONIAL_LIMIT,
  isPublicReviewStatus,
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

function publishedFilter(query) {
  return query.or(
    "is_approved.eq.true,is_testimonial.eq.true,status.eq.Published,status.eq.Testimonial"
  );
}

function isMissingColumnError(error, column) {
  const message = String(error?.message || error?.details || "");
  return message.toLowerCase().includes(column.toLowerCase());
}

export async function getProductReviews(productId, { includeUnapproved = false } = {}) {
  const supabase = anonClient();
  let query = supabase
    .from("reviews")
    .select("*")
    .eq("product_id", Number(productId))
    .order("created_at", { ascending: false });
  if (!includeUnapproved) {
    query = publishedFilter(query);
  }
  let { data, error } = await query;
  if (error && isMissingColumnError(error, "is_testimonial")) {
    let fallback = supabase
      .from("reviews")
      .select("*")
      .eq("product_id", Number(productId))
      .order("created_at", { ascending: false });
    if (!includeUnapproved) {
      fallback = fallback.or("is_approved.eq.true,status.eq.Published,status.eq.Testimonial");
    }
    ({ data, error } = await fallback);
  }
  throwIf(error, "Unable to load reviews.", 500);
  return (data || []).map(mapReview);
}

export async function getTestimonialReviews({ limit = TESTIMONIAL_LIMIT } = {}) {
  const supabase = anonClient();
  const featured = await supabase
    .from("reviews")
    .select("*")
    .eq("is_testimonial", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!featured.error) {
    return (featured.data || []).map(mapReview);
  }

  if (!isMissingColumnError(featured.error, "is_testimonial")) {
    throwIf(featured.error, "Unable to load testimonials.", 500);
  }

  const published = await supabase
    .from("reviews")
    .select("*")
    .or("is_approved.eq.true,status.eq.Published")
    .order("created_at", { ascending: false })
    .limit(80);
  throwIf(published.error, "Unable to load testimonials.", 500);
  return (published.data || [])
    .map(mapReview)
    .filter((review) => review.isTestimonial)
    .slice(0, limit);
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
  const { data } = await publishedFilter(
    supabase.from("reviews").select("rating").eq("product_id", Number(productId))
  );
  const ratings = (data || []).map((row) => Number(row.rating)).filter((value) => value > 0);
  const review_count = ratings.length;
  const rating = review_count
    ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / review_count) * 100) / 100
    : 0;
  await supabase
    .from("products")
    .update({ review_count, rating })
    .eq("id", Number(productId));
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
      status: REVIEW_STATUS.PUBLISHED,
      is_approved: true,
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
    const byStatus = await supabase
      .from("reviews")
      .select("id, created_at")
      .eq("status", REVIEW_STATUS.TESTIMONIAL)
      .order("created_at", { ascending: false });
    rows = byStatus.data;
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
  if (wantsTestimonialStatus(status) || status === REVIEW_STATUS.PUBLISHED) {
    return REVIEW_STATUS.PUBLISHED;
  }
  if (status === REVIEW_STATUS.HIDDEN) return REVIEW_STATUS.HIDDEN;
  if (status === REVIEW_STATUS.PENDING) return REVIEW_STATUS.PENDING;
  return REVIEW_STATUS.PUBLISHED;
}

function reviewStatusPatch(status) {
  const featured = wantsTestimonialStatus(status);
  return {
    status: dbStatus(status),
    is_approved: featured || isPublicReviewStatus(status),
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
      is_approved: featured || current.data?.is_approved === true,
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
    .select("product_id")
    .maybeSingle();
  throwIf(error, "Unable to delete review.");
  if (data?.product_id) {
    await refreshProductReviewStats(supabase, data.product_id);
  }
  return true;
}
