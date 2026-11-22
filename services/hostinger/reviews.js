import { AppError } from "@/lib/errors";
import { query, queryOne } from "@/lib/db";
import { asBool, nextId, normalizeMysqlRow, normalizeMysqlRows } from "@/lib/mysql/helpers";
import { mapReview } from "@/lib/mappers";
import { statsFromReviewRows } from "@/lib/ratings";
import {
  REVIEW_STATUS,
  TESTIMONIAL_LIMIT,
  isHomepageTestimonialRow,
  isReviewPublicRow,
  wantsTestimonialStatus,
} from "@/lib/reviewStatus";

let reviewStatsCache = { at: 0, map: new Map() };
const REVIEW_STATS_TTL_MS = 20_000;

export async function loadPublicReviewStatsMap() {
  if (Date.now() - reviewStatsCache.at < REVIEW_STATS_TTL_MS) return reviewStatsCache.map;
  const rows = normalizeMysqlRows(
    await query("SELECT product_id, rating, status, is_approved, is_testimonial, comment FROM reviews")
  );
  const map = statsFromReviewRows(rows || []);
  const products = await query("SELECT id, rating, review_count FROM products");
  for (const row of products || []) {
    const productId = Number(row.id);
    const reviewCount = Math.max(0, Number(row.review_count ?? 0));
    if (!productId || reviewCount <= 0) continue;
    const fromReviews = map.get(productId);
    if (!fromReviews || fromReviews.reviewCount < reviewCount) {
      map.set(productId, {
        reviewCount,
        rating: fromReviews?.rating || Number(row.rating) || 0,
      });
    }
  }
  reviewStatsCache = { at: Date.now(), map };
  return map;
}

export function invalidateReviewStatsCache() {
  reviewStatsCache = { at: 0, map: new Map() };
}

async function refreshProductReviewStats(productId) {
  const id = Number(productId);
  if (!id) return;
  const rows = normalizeMysqlRows(
    await query(
      "SELECT product_id, rating, status, is_approved, is_testimonial, comment FROM reviews WHERE product_id = ?",
      [id]
    )
  );
  const stats = statsFromReviewRows(rows || []).get(id) || { reviewCount: 0, rating: 0 };
  await query("UPDATE products SET review_count = ?, rating = ? WHERE id = ?", [
    stats.reviewCount || 0,
    stats.rating || 0,
    id,
  ]);
  invalidateReviewStatsCache();
}

export async function getProductReviews(productId, { includeUnapproved = false } = {}) {
  const id = Number(productId);
  if (!id) return [];
  const rows = normalizeMysqlRows(
    await query("SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC", [id])
  );
  return rows
    .filter((row) => (includeUnapproved ? true : isReviewPublicRow(row)))
    .map(mapReview)
    .filter(Boolean);
}

export async function getTestimonialReviews({ limit = TESTIMONIAL_LIMIT } = {}) {
  const rows = normalizeMysqlRows(await query("SELECT * FROM reviews ORDER BY created_at DESC LIMIT 120"));
  return rows
    .filter((row) => isHomepageTestimonialRow(row))
    .slice(0, limit)
    .map(mapReview)
    .filter(Boolean);
}

export async function getAllReviews() {
  const rows = normalizeMysqlRows(await query("SELECT * FROM reviews ORDER BY created_at DESC"));
  return rows.map(mapReview);
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
  const product = await queryOne("SELECT id, name, is_active FROM products WHERE id = ?", [productId]);
  if (!product || !Number(product.is_active)) throw new AppError("Product not found", 404);
  const id = nextId();
  await query(
    `INSERT INTO reviews (
      id, product_id, product_name, author, customer_name, user_id, rating, title, comment, status, is_approved, is_testimonial
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      productId,
      input.productName || product.name,
      author,
      author,
      input.userId || null,
      rating,
      title,
      comment,
      REVIEW_STATUS.PENDING,
      0,
      0,
    ]
  );
  await refreshProductReviewStats(productId);
  const row = normalizeMysqlRow(await queryOne("SELECT * FROM reviews WHERE id = ?", [id]));
  return mapReview(row);
}

function dbStatus(status) {
  if (wantsTestimonialStatus(status)) return REVIEW_STATUS.PUBLISHED;
  if (status === REVIEW_STATUS.PUBLISHED) return REVIEW_STATUS.PUBLISHED;
  if (status === REVIEW_STATUS.HIDDEN) return REVIEW_STATUS.HIDDEN;
  if (status === REVIEW_STATUS.PENDING) return REVIEW_STATUS.PENDING;
  return REVIEW_STATUS.PUBLISHED;
}

export async function updateReview(id, input) {
  const current = normalizeMysqlRow(await queryOne("SELECT * FROM reviews WHERE id = ?", [id]));
  if (!current) throw new AppError("Review not found", 404);
  const featured = wantsTestimonialStatus(input.status);
  const patch = { ...current };
  if (input.status) {
    patch.status = dbStatus(input.status);
    patch.is_approved = featured || input.status === REVIEW_STATUS.PUBLISHED;
    patch.is_testimonial = featured;
  }
  if (input.isApproved != null && !input.status) {
    patch.is_approved = Boolean(input.isApproved);
    patch.status = input.isApproved ? REVIEW_STATUS.PUBLISHED : REVIEW_STATUS.HIDDEN;
    patch.is_testimonial = false;
  }
  if (input.comment != null) patch.comment = input.comment;
  if (input.title != null) patch.title = input.title;
  if (input.rating != null) patch.rating = Number(input.rating);
  await query(
    `UPDATE reviews SET status=?, is_approved=?, is_testimonial=?, comment=?, title=?, rating=? WHERE id=?`,
    [
      patch.status,
      asBool(patch.is_approved),
      asBool(patch.is_testimonial),
      patch.comment,
      patch.title,
      patch.rating,
      id,
    ]
  );
  if (featured) {
    const extras = normalizeMysqlRows(
      await query(
        "SELECT id FROM reviews WHERE is_testimonial = 1 AND id <> ? ORDER BY created_at DESC",
        [id]
      )
    ).slice(TESTIMONIAL_LIMIT - 1);
    for (const extra of extras) {
      await query(
        "UPDATE reviews SET is_testimonial = 0, status = ?, is_approved = 1 WHERE id = ?",
        [REVIEW_STATUS.PUBLISHED, extra.id]
      );
    }
  }
  await refreshProductReviewStats(current.product_id);
  const row = normalizeMysqlRow(await queryOne("SELECT * FROM reviews WHERE id = ?", [id]));
  return mapReview(row);
}

export async function deleteReview(id) {
  const current = await queryOne("SELECT product_id FROM reviews WHERE id = ?", [id]);
  await query("DELETE FROM reviews WHERE id = ?", [id]);
  if (current?.product_id) await refreshProductReviewStats(current.product_id);
  invalidateReviewStatsCache();
  return current
    ? { product_id: current.product_id, productId: Number(current.product_id) }
    : true;
}
