function normalizeKey(value) {
  return String(value || "").trim();
}

function toQty(value) {
  const qty = Number(value);
  if (!Number.isFinite(qty) || qty < 0) return 0;
  return Math.floor(qty);
}

export function normalizeVariantStock(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const next = {};
  Object.entries(input).forEach(([colorKey, sizes]) => {
    const color = normalizeKey(colorKey);
    if (!color || !sizes || typeof sizes !== "object" || Array.isArray(sizes)) return;
    const row = {};
    Object.entries(sizes).forEach(([sizeKey, qty]) => {
      const size = normalizeKey(sizeKey);
      if (!size) return;
      row[size] = toQty(qty);
    });
    if (Object.keys(row).length) next[color] = row;
  });
  return next;
}

export function hasVariantStock(product) {
  const stock = product?.variantStock || product?.variant_stock;
  return Boolean(stock && typeof stock === "object" && Object.keys(stock).length);
}

export function sumVariantStock(variantStock) {
  return Object.values(normalizeVariantStock(variantStock)).reduce((total, sizes) => {
    return total + Object.values(sizes).reduce((sum, qty) => sum + toQty(qty), 0);
  }, 0);
}

export function getProductStock(product) {
  if (hasVariantStock(product)) return sumVariantStock(product.variantStock || product.variant_stock);
  return Math.max(0, Number(product?.stock) || 0);
}

function matchColorKey(variantStock, color) {
  const wanted = normalizeKey(color).toLowerCase();
  return Object.keys(variantStock).find((key) => key.toLowerCase() === wanted) || "";
}

function matchSizeKey(sizes, size) {
  const wanted = normalizeKey(size).toLowerCase();
  return Object.keys(sizes).find((key) => key.toLowerCase() === wanted) || "";
}

export function getVariantQty(product, color, size) {
  if (!hasVariantStock(product)) return getProductStock(product);
  const variantStock = normalizeVariantStock(product.variantStock || product.variant_stock);
  const colorKey = matchColorKey(variantStock, color);
  if (!colorKey) return 0;
  const sizeKey = matchSizeKey(variantStock[colorKey], size);
  if (!sizeKey) return 0;
  return toQty(variantStock[colorKey][sizeKey]);
}

export function getColorStock(product, color) {
  if (!hasVariantStock(product)) return getProductStock(product);
  const variantStock = normalizeVariantStock(product.variantStock || product.variant_stock);
  const colorKey = matchColorKey(variantStock, color);
  if (!colorKey) return 0;
  return Object.values(variantStock[colorKey]).reduce((sum, qty) => sum + toQty(qty), 0);
}

export function isColorSoldOut(product, color) {
  return getColorStock(product, color) <= 0;
}

export function isSizeSoldOut(product, color, size) {
  return getVariantQty(product, color, size) <= 0;
}

export function firstInStockColor(product, colors = []) {
  const list = colors.length ? colors : product?.colors || [];
  return list.find((color) => !isColorSoldOut(product, color)) || list[0] || "";
}

export function firstInStockSize(product, color, sizes = []) {
  const list = sizes.length ? sizes : product?.sizes || [];
  return list.find((size) => !isSizeSoldOut(product, color, size)) || list[0] || "";
}

export function buildVariantStock(colors, sizes, current = {}) {
  const existing = normalizeVariantStock(current);
  const next = {};
  (colors || []).forEach((color) => {
    const colorKey = normalizeKey(color);
    if (!colorKey) return;
    const matched = matchColorKey(existing, colorKey);
    const row = {};
    (sizes || []).forEach((size) => {
      const sizeKey = normalizeKey(size);
      if (!sizeKey) return;
      const prevSize = matched ? matchSizeKey(existing[matched], sizeKey) : "";
      row[sizeKey] = prevSize ? toQty(existing[matched][prevSize]) : 0;
    });
    next[colorKey] = row;
  });
  return next;
}

export function seedVariantStock(product) {
  const existing = normalizeVariantStock(product?.variantStock || product?.variant_stock);
  if (Object.keys(existing).length) return existing;
  const colors = product?.colors || [];
  const sizes = product?.sizes || [];
  const seeded = buildVariantStock(colors, sizes, {});
  const total = Math.max(0, Number(product?.stock) || 0);
  if (total > 0 && colors[0] && sizes[0] && seeded[colors[0]]) {
    seeded[colors[0]][sizes[0]] = total;
  }
  return seeded;
}
