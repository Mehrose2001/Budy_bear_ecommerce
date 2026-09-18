export function getProductImages(product, color) {
  const variants = product?.colorImages || [];
  const matched = variants
    .filter((item) => item?.url && (!color || item.color === color))
    .map((item) => item.url);

  if (color && matched.length) return matched;
  if (product?.images?.length) return product.images;
  if (variants.length) return variants.map((item) => item.url).filter(Boolean);
  return ["/images/products/product-1.svg"];
}

export function getColorSwatch(product, color) {
  return product?.colorSwatches?.[color] || null;
}
