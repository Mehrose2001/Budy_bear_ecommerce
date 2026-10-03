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

export function isPublicReviewStatus(status) {
  const value = String(status || "");
  return value === REVIEW_STATUS.PUBLISHED || wantsTestimonialStatus(value);
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
