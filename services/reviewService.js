import { AppError, throwIf } from "@/lib/errors";
import { mapReview } from "@/lib/mappers";
import {
  createServerClient,
  createServiceClient,
  createUserClient,
} from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function client(accessToken) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase is not configured.", 503);
  }
  return accessToken ? createUserClient(accessToken) : createServerClient();
}

function writeClient(accessToken) {
  return createServiceClient() || client(accessToken);
}

function publishedFilter(query) {
  return query.or("is_approved.eq.true,status.eq.Published");
}

export async function getProductReviews(productId, { includeUnapproved = false, accessToken } = {}) {
  const supabase = client(accessToken);
  let query = supabase
    .from("reviews")
    .select("*")
    .eq("product_id", Number(productId))
    .order("created_at", { ascending: false });
  if (!includeUnapproved) {
    query = publishedFilter(query);
  }
  const { data, error } = await query;
  throwIf(error, "Unable to load reviews.", 500);
  return (data || []).map(mapReview);
}

export async function getAllReviews(accessToken) {
  const supabase = client(accessToken);
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

export async function createReview(input, accessToken) {
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

  const supabase = writeClient(accessToken);
  const service = createServiceClient();

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
      status: "Published",
      is_approved: true,
    };
    const { data, error } = await service.from("reviews").insert(row).select("*").maybeSingle();
    if (!error && data) {
      await refreshProductReviewStats(service, productId);
      return mapReview(data);
    }
  }

  const payload = {
    p_product_id: productId,
    p_author: author,
    p_rating: rating,
    p_title: title,
    p_comment: comment,
    p_user_id: input.userId || null,
  };

  const rpc = await supabase.rpc("submit_review", payload);
  if (!rpc.error && rpc.data) {
    return mapReview(rpc.data);
  }

  throwIf(rpc.error, "Unable to save review.");
}

export async function updateReview(id, input, accessToken) {
  const supabase = writeClient(accessToken);
  const patch = {};
  if (input.status) {
    patch.status = input.status;
    patch.is_approved = input.status === "Published";
  }
  if (input.isApproved != null) {
    patch.is_approved = Boolean(input.isApproved);
    patch.status = input.isApproved ? "Published" : "Hidden";
  }
  if (input.comment != null) patch.comment = input.comment;
  if (input.title != null) patch.title = input.title;
  if (input.rating != null) patch.rating = Number(input.rating);
  const { data, error } = await supabase
    .from("reviews")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  throwIf(error, "Unable to update review.");
  if (!data) throw new AppError("Review not found", 404);
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
