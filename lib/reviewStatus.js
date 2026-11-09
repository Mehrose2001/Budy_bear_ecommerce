export const REVIEW_STATUS = {
  PENDING: "Pending",
  PUBLISHED: "Published",
  TESTIMONIAL: "Testimonial",
  HIDDEN: "Hidden",
};

export const TESTIMONIAL_LIMIT = 4;
export const TESTIMONIAL_MARKER = "[[bb-testimonial]]";

export function wantsTestimonialStatus(status) {
  return /testimonial/i.test(String(status || ""));
}

export function normalizeReviewStatus(status) {
  const value = String(status || "").trim();
  if (!value) return "";
  const lower = value.toLowerCase();
  if (lower === "published") return REVIEW_STATUS.PUBLISHED;
  if (lower === "pending") return REVIEW_STATUS.PENDING;
  if (lower === "hidden") return REVIEW_STATUS.HIDDEN;
  if (lower === "testimonial" || wantsTestimonialStatus(value)) return REVIEW_STATUS.TESTIMONIAL;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function isPublicReviewStatus(status) {
  const value = normalizeReviewStatus(status);
  return value === REVIEW_STATUS.PUBLISHED || value === REVIEW_STATUS.TESTIMONIAL;
}

/** Raw Supabase row — whether shoppers may see this review on a product page. */
export function isReviewPublicRow(row) {
  if (!row) return false;
  const status = normalizeReviewStatus(row.status);
  if (status === REVIEW_STATUS.HIDDEN) return false;
  if (row.is_approved === true) return true;
  if (row.is_testimonial === true || hasTestimonialMarker(row.comment)) return true;
  if (status === REVIEW_STATUS.PUBLISHED || status === REVIEW_STATUS.TESTIMONIAL) return true;
  return false;
}

/** Mapped review object from mapReview. */
export function isReviewPublicMapped(review) {
  if (!review) return false;
  if (review.isApproved === true) return true;
  const status = normalizeReviewStatus(review.status);
  return status === REVIEW_STATUS.PUBLISHED || status === REVIEW_STATUS.TESTIMONIAL;
}

/** Homepage testimonials only — explicit testimonial flag/marker, still public. */
export function isHomepageTestimonialRow(row) {
  if (!row || !isReviewPublicRow(row)) return false;
  return row.is_testimonial === true || hasTestimonialMarker(row.comment);
}

export function isHomepageTestimonialMapped(review) {
  if (!review || !isReviewPublicMapped(review)) return false;
  return Boolean(review.isTestimonial);
}

export function stripTestimonialMarker(comment) {
  return String(comment || "")
    .replace(/\s*\[\[bb-testimonial\]\]\s*/g, "")
    .trim();
}

export function withTestimonialMarker(comment, enabled) {
  const base = stripTestimonialMarker(comment);
  if (!enabled) return base;
  return base ? `${base}\n\n${TESTIMONIAL_MARKER}` : TESTIMONIAL_MARKER;
}

export function hasTestimonialMarker(comment) {
  return /\[\[bb-testimonial\]\]/.test(String(comment || ""));
}

export function isTestimonialReview(review) {
  return (
    Boolean(review?.isTestimonial) ||
    review?.status === REVIEW_STATUS.TESTIMONIAL ||
    hasTestimonialMarker(review?.comment)
  );
}
