const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

export const emptyCategoryBanner = () => ({
  enabled: false,
  heading: "",
  description: "",
  ctaLabel: "",
  ctaHref: "",
  mediaType: "image",
  image: "",
  imageMobile: "",
  video: "",
  videoPoster: "",
});

function cleanString(value) {
  return String(value || "").trim();
}

export function normalizeCategoryBanner(input) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const mediaType = cleanString(source.mediaType).toLowerCase() === "video" ? "video" : "image";
  return {
    enabled: Boolean(source.enabled),
    heading: cleanString(source.heading),
    description: cleanString(source.description),
    ctaLabel: cleanString(source.ctaLabel || source.cta_label),
    ctaHref: cleanString(source.ctaHref || source.cta_href),
    mediaType,
    image: cleanString(source.image),
    imageMobile: cleanString(source.imageMobile || source.image_mobile),
    video: cleanString(source.video),
    videoPoster: cleanString(source.videoPoster || source.video_poster),
  };
}

export function categoryBannerHasContent(banner) {
  const normalized = normalizeCategoryBanner(banner);
  if (!normalized.enabled) return false;
  return Boolean(normalized.image || normalized.imageMobile || normalized.videoPoster);
}

export function validateBannerUpload(file, kind = "image") {
  if (!file) return "Choose a file to upload.";
  const isVideo = kind === "video";
  const allowed = isVideo ? VIDEO_TYPES : IMAGE_TYPES;
  if (!allowed.has(file.type)) {
    return isVideo ? "Use MP4 or WebM video." : "Use JPG, PNG, or WebP images.";
  }
  const max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > max) {
    return isVideo ? "Video must be under 40MB." : "Image must be under 8MB.";
  }
  return "";
}

export function normalizeSubcategoryBannerMap(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const map = {};
  for (const [key, value] of Object.entries(input)) {
    const slug = cleanString(key);
    if (!slug) continue;
    map[slug] = normalizeCategoryBanner(value);
  }
  return map;
}

export function resolveListingBanner(category, subcategorySlug = "") {
  if (!category) return null;
  const subMap = category.subcategoryBanners || category.subcategory_banners || {};
  const subKey = cleanString(subcategorySlug).toLowerCase();
  if (subKey && subMap[subKey] && categoryBannerHasContent(subMap[subKey])) {
    return normalizeCategoryBanner(subMap[subKey]);
  }
  const main = normalizeCategoryBanner(category.banner);
  return categoryBannerHasContent(main) ? main : null;
}
