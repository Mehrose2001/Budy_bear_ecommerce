import {
  isReviewPublicMapped,
  isReviewPublicRow,
} from "@/lib/reviewStatus";

function ratingValue(row) {
  const value = Number(row?.rating);
  return Number.isFinite(value) && value >= 1 && value <= 5 ? value : 0;
}

export function productRatingSummary(product) {
  const count = Math.max(0, Number(product?.reviewCount ?? product?.review_count ?? 0));
  if (count <= 0) {
    return { rating: 0, count: 0, hasReviews: false };
  }
  const raw = Number(product?.rating);
  const rating = Number.isFinite(raw) ? Math.min(5, Math.max(0, raw)) : 0;
  return { rating, count, hasReviews: true };
}

export function formatAverageRating(rating) {
  const value = Number(rating) || 0;
  if (!value) return "0";
  return (Math.round(value * 10) / 10).toFixed(value % 1 === 0 ? 0 : 1);
}

export function statsFromReviewRows(rows = []) {
  const map = new Map();
  for (const row of rows) {
    if (!isReviewPublicRow(row)) continue;
    const productId = Number(row.product_id);
    if (!productId) continue;
    const rating = ratingValue(row);
    if (!rating) continue;
    const current = map.get(productId) || { total: 0, count: 0 };
    current.total += rating;
    current.count += 1;
    map.set(productId, current);
  }
  const result = new Map();
  for (const [productId, { total, count }] of map.entries()) {
    result.set(productId, {
      reviewCount: count,
      rating: Math.round((total / count) * 100) / 100,
    });
  }
  return result;
}

export function statsFromMappedReviews(reviews = []) {
  const publicReviews = reviews.filter(isReviewPublicMapped);
  const ratings = publicReviews.map((review) => ratingValue(review)).filter(Boolean);
  if (!ratings.length) {
    return { rating: 0, reviewCount: 0, hasReviews: false };
  }
  const reviewCount = ratings.length;
  const rating = Math.round((ratings.reduce((sum, value) => sum + value, 0) / reviewCount) * 100) / 100;
  return { rating, reviewCount, hasReviews: true };
}

export function mergeProductReviewStats(product, statsMap) {
  if (!product?.id || !statsMap || statsMap.size === 0) return product;
  const fromReviews = statsMap.get(Number(product.id));
  if (fromReviews) {
    return {
      ...product,
      rating: fromReviews.rating,
      reviewCount: fromReviews.reviewCount,
    };
  }
  const reviewCount = Math.max(0, Number(product.reviewCount ?? product.review_count ?? 0));
  const rating = Number(product.rating) || 0;
  return { ...product, rating, reviewCount };
}

export function applyReviewStatsToProduct(product, reviews = []) {
  const stats = statsFromMappedReviews(reviews);
  return {
    ...product,
    rating: stats.rating,
    reviewCount: stats.reviewCount,
  };
}
