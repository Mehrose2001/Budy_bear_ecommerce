export function getProductColors(product) {
  const seen = new Set();
  const colors = [];
  const add = (value) => {
    const color = String(value || "").trim();
    if (!color) return;
    const key = color.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    colors.push(color);
  };

  (Array.isArray(product?.colorImages) ? product.colorImages : []).forEach((item) => add(item?.color));
  (Array.isArray(product?.colors) ? product.colors : []).forEach(add);
  Object.keys(product?.colorSwatches || {}).forEach(add);
  Object.keys(product?.variantStock || product?.variant_stock || {}).forEach(add);
  return colors;
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

export const FALLBACK_PRODUCT_IMAGE = "/images/products/product-1.svg";

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

export function productThumbSrc(product, fallback = FALLBACK_PRODUCT_IMAGE) {
  if (typeof product === "string" && product) return product;
  if (product?.url) return product.url;
  return getProductListImage(product) || fallback;
}

function imageSrcs(value) {
  return asImageList(value)
    .map((item) => {
      if (typeof item === "string") return item;
      if (item?.url) return item.url;
      return "";
    })
    .filter(Boolean);
}

function sameColor(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

export function getProductImages(product, color) {
  const variants = Array.isArray(product?.colorImages) ? product.colorImages : [];
  const matched = variants
    .filter((item) => item?.url && (!color || sameColor(item.color, color)))
    .map((item) => item.url)
    .filter(Boolean);

  if (color && matched.length) return matched;
  const images = imageSrcs(product?.images);
  if (images.length) return images;
  if (variants.length) return variants.map((item) => item.url).filter(Boolean);
  return ["/images/products/product-1.svg"];
}

export function getColorSwatch(product, color) {
  if (product?.colorSwatches?.[color]) return product.colorSwatches[color];
  const key = Object.keys(product?.colorSwatches || {}).find((name) => sameColor(name, color));
  if (key) return product.colorSwatches[key];
  const fromImage = (Array.isArray(product?.colorImages) ? product.colorImages : []).find(
    (item) => item?.hex && sameColor(item.color, color)
  );
  return fromImage?.hex || null;
}
