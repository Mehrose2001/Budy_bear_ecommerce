export function formatPrice(price) {
  const amount = Math.round(Number(price) || 0);
  const grouped = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Rs. ${grouped}`;
}

export function getDiscountPercent(price, salePrice) {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatLabel(value) {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
