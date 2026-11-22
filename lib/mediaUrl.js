function publicUploadsBase() {
  return String(
    process.env.HOSTINGER_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_MEDIA_URL ||
      "https://budybear.com/uploads"
  ).replace(/\/$/, "");
}

function supabaseObjectPath(url) {
  const marker = "/storage/v1/object/public/product-images/";
  const index = url.indexOf(marker);
  if (index < 0) return "";
  const objectPath = decodeURIComponent(url.slice(index + marker.length).split(/[?#]/)[0]);
  if (objectPath.startsWith("products/draft/")) return `draft/${objectPath.slice("products/draft/".length)}`;
  return objectPath;
}

export function normalizeMediaUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  const unescaped = url.replace(/\\+/g, "");
  const cleaned = unescaped.replace(/^https?:\/\/[^/]+\/media\/media\//i, "/media/");
  if (/\/storage\/v1\/object\/public\/product-images\//i.test(cleaned)) {
    const relative = supabaseObjectPath(cleaned);
    if (relative) return `${publicUploadsBase()}/${relative}`;
  }
  if (cleaned.startsWith("/media/")) {
    return `${publicUploadsBase()}/${cleaned.replace(/^\/media\//, "")}`;
  }
  return cleaned;
}

function normalizeColorImage(item) {
  if (!item || typeof item !== "object") return item;
  const url = item.url || item.image || "";
  if (!url) return item;
  return { ...item, url: normalizeMediaUrl(url) };
}

export function normalizeMediaList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === "string" ? normalizeMediaUrl(item) : item));
}

export function normalizeColorImages(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeColorImage);
}

export function rewriteMediaValue(value) {
  if (typeof value === "string") return normalizeMediaUrl(value);
  if (Array.isArray(value)) return value.map(rewriteMediaValue);
  if (value && typeof value === "object") {
    const next = {};
    for (const [key, item] of Object.entries(value)) next[key] = rewriteMediaValue(item);
    return next;
  }
  return value;
}
