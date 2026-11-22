const BOOL_FIELDS = new Set([
  "is_active",
  "is_featured",
  "featured",
  "new_arrival",
  "best_seller",
  "active",
  "is_approved",
  "is_testimonial",
  "email_confirmed",
  "password_needs_reset",
  "verified",
]);

const JSON_FIELDS = new Set([
  "images",
  "color_images",
  "color_swatches",
  "sizes",
  "colors",
  "variant_stock",
  "subcategories",
  "seo",
  "subcategory_seo",
  "banner",
  "subcategory_banners",
  "items",
  "shipping_address",
  "customer",
  "legal_pages",
  "offer",
  "seasonal_banner",
  "raw_user_meta",
]);

export function asJson(value, fallback = null) {
  if (value == null) return fallback == null ? null : JSON.stringify(fallback);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function asText(value) {
  if (value == null) return value;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
    return value.toString("utf8");
  }
  return value;
}

export function fromJson(value, fallback = null) {
  const raw = asText(value);
  if (raw == null || raw === "") return fallback;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function asBool(value) {
  if (value === true || value === 1 || value === "1") return 1;
  return 0;
}

export function asDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function nextId() {
  return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeMysqlRow(row) {
  if (!row || typeof row !== "object") return row;
  const next = { ...row };
  for (const key of Object.keys(next)) {
    if (BOOL_FIELDS.has(key)) next[key] = Boolean(next[key]);
    if (JSON_FIELDS.has(key)) next[key] = fromJson(next[key], next[key]);
  }
  return next;
}

export function normalizeMysqlRows(rows) {
  return (rows || []).map(normalizeMysqlRow);
}
