const AUTHORS = [
  "Ayesha K.",
  "Hassan M.",
  "Sara R.",
  "Bilal A.",
  "Fatima N.",
  "Omar S.",
];

const COMMENTS = [
  "Great quality and my child loves wearing it.",
  "Soft fabric and true to size. Will order again.",
  "Arrived quickly and looks just like the photos.",
  "Comfortable for all-day play and everyday wear.",
  "Premium feel without an expensive price.",
  "Colors stayed bright after washing.",
];

export function getReviewsForProduct(product) {
  const count = Math.min(product.reviewCount, 6);

  return Array.from({ length: count }, (_, index) => ({
    id: `${product.id}-review-${index + 1}`,
    author: AUTHORS[index % AUTHORS.length],
    rating: Math.max(3, Math.min(5, Math.round(product.rating - (index % 2) * 0.3))),
    title: index === 0 ? "Highly recommended" : "Happy with this purchase",
    comment: COMMENTS[index % COMMENTS.length],
    date: `2026-0${(index % 8) + 1}-${String(12 + index).padStart(2, "0")}`,
  }));
}
