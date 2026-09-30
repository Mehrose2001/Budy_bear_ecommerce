import { AppError, throwIf } from "@/lib/errors";
import { mapReview } from "@/lib/mappers";
import { createServerClient, createUserClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function client(accessToken) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase is not configured.", 503);
  }
  return accessToken ? createUserClient(accessToken) : createServerClient();
}

export async function getProductReviews(productId, { includeUnapproved = false, accessToken } = {}) {
  const supabase = client(accessToken);
  let query = supabase
    .from("reviews")
    .select("*")
    .eq("product_id", Number(productId))
    .order("created_at", { ascending: false });
  if (!includeUnapproved) {
    query = query.or("is_approved.eq.true,status.eq.Published");
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

export async function createReview(input, accessToken) {
  const supabase = client(accessToken);
  const { data, error } = await supabase.rpc("submit_review", {
    p_product_id: Number(input.productId),
    p_author: input.author || input.customerName || "Customer",
    p_rating: Number(input.rating),
    p_title: input.title || "",
    p_comment: input.comment || "",
    p_user_id: input.userId || null,
  });
  throwIf(error, "Unable to save review.");
  return mapReview(data);
}

export async function updateReview(id, input, accessToken) {
  const supabase = client(accessToken);
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
  if (input.rating != null) patch.rating = Number(input.rating);
  const { data, error } = await supabase
    .from("reviews")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  throwIf(error, "Unable to update review.");
  if (!data) throw new AppError("Review not found", 404);
  return mapReview(data);
}

export async function deleteReview(id, accessToken) {
  const supabase = client(accessToken);
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  throwIf(error, "Unable to delete review.");
  return true;
}
