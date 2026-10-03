export function getProductColors(product) {
  const seen = new Set();
  const fromImages = (product?.colorImages || [])
    .map((item) => String(item?.color || "").trim())
    .filter(Boolean)
    .filter((color) => {
      const key = color.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (fromImages.length) return fromImages;
  return Array.isArray(product?.colors) ? product.colors.filter(Boolean) : [];
}

function asImageList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [value];
    }
  }
  return [];
}

export function getProductListImage(product) {
  const images = asImageList(product?.images);
  const first = images[0];
  if (typeof first === "string" && first) return first;
  if (first?.url) return first.url;
  const colorFirst = asImageList(product?.colorImages)[0];
  if (colorFirst?.url) return colorFirst.url;
  if (typeof colorFirst?.images?.[0] === "string") return colorFirst.images[0];
  return "";
}

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
