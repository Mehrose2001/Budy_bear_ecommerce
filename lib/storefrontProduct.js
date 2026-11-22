function asUrls(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item : item?.url || ""))
    .filter((url) => url && !String(url).includes("/uploads/draft/"));
}

export function storefrontProduct(product) {
  if (!product) return null;
  const images = asUrls(product.images).slice(0, 8);
  const colorImages = (Array.isArray(product.colorImages) ? product.colorImages : [])
    .filter((item) => item?.url && !String(item.url).includes("/uploads/draft/"))
    .slice(0, 12)
    .map((item) => ({ color: item.color || "", url: item.url }));
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: String(product.description || "").slice(0, 4000),
    category: product.category,
    subcategory: product.subcategory || "",
    subcategories: Array.isArray(product.subcategories) ? product.subcategories : [],
    price: product.price,
    salePrice: product.salePrice,
    images,
    colorImages,
    colorSwatches:
      product.colorSwatches && typeof product.colorSwatches === "object" ? product.colorSwatches : {},
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    colors: Array.isArray(product.colors) ? product.colors : [],
    variantStock: product.variantStock && typeof product.variantStock === "object" ? product.variantStock : {},
    stock: Number(product.stock || 0),
    rating: Number(product.rating || 0),
    reviewCount: Number(product.reviewCount || 0),
    brand: product.brand || "Budy Bear",
    featured: Boolean(product.featured),
    newArrival: Boolean(product.newArrival),
    bestSeller: Boolean(product.bestSeller),
  };
}

export function storefrontCard(product) {
  const slim = storefrontProduct(product);
  if (!slim) return null;
  return {
    ...slim,
    description: "",
    colorImages: [],
    colorSwatches: {},
    images: slim.images.slice(0, 2),
  };
}

export function storefrontReview(review) {
  if (!review) return null;
  return {
    id: review.id,
    productId: review.productId,
    author: review.author || review.customerName || "Customer",
    customerName: review.customerName || review.author || "Customer",
    rating: Number(review.rating || 0),
    title: review.title || "",
    comment: String(review.comment || "").slice(0, 1000),
    status: review.status,
    isApproved: review.isApproved,
    isTestimonial: review.isTestimonial,
    date: review.date || "",
  };
}
