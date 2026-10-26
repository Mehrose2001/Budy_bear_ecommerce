export function normalizeMediaUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  return url.replace(/^https?:\/\/[^/]+\/media\/media\//i, "/media/");
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
