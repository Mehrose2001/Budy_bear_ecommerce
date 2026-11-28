import { normalizeMediaUrl } from "@/lib/mediaUrl";

const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

const HOSTINGER_LISTING_BANNERS = {
  boys: {
    enabled: true,
    mediaType: "image",
    image: "https://budybear.com/uploads/products/boys/1795716151704-51f4b9ae-9c6b-48a0-9dd7-14e572150d1f.png",
    imageMobile: "https://budybear.com/uploads/products/boys/1795716160529-0fc07513-54b1-4173-96b8-eac90883e750.png",
  },
  girls: {
    enabled: true,
    mediaType: "image",
    image: "https://budybear.com/uploads/products/girls/1795716517983-0ca939b8-42c7-4ed3-bf67-96207dedd76d.png",
    imageMobile: "https://budybear.com/uploads/products/girls/1795716533314-ba1b6919-b503-42da-836a-efddc13eb3a3.png",
  },
  infant: {
    enabled: true,
    mediaType: "image",
    image: "https://budybear.com/uploads/products/infant/1795716764085-0fe1783a-7ba0-49b6-99aa-bdf6b46d1510.png",
    imageMobile: "https://budybear.com/uploads/products/infant/1795716770410-eb457121-6666-4ba2-ac2c-4904ad8a8e66.png",
  },
};

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
    image: normalizeMediaUrl(cleanString(source.image)) || cleanString(source.image),
    imageMobile:
      normalizeMediaUrl(cleanString(source.imageMobile || source.image_mobile)) ||
      cleanString(source.imageMobile || source.image_mobile),
    video: cleanString(source.video),
    videoPoster:
      normalizeMediaUrl(cleanString(source.videoPoster || source.video_poster)) ||
      cleanString(source.videoPoster || source.video_poster),
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

export function preferStoredBanner(overlayBanner, storedBanner) {
  if (categoryBannerHasContent(overlayBanner)) return overlayBanner;
  if (categoryBannerHasContent(storedBanner)) return storedBanner;
  return null;
}

export function preferStoredBannerMap(overlayMap, storedMap) {
  const overlay = overlayMap && typeof overlayMap === "object" && !Array.isArray(overlayMap) ? overlayMap : null;
  if (overlay && Object.values(overlay).some((banner) => categoryBannerHasContent(banner))) {
    return overlay;
  }
  return storedMap || overlay;
}

export function resolveListingBanner(category, subcategorySlug = "") {
  if (!category) return null;
  const subMap = category.subcategoryBanners || category.subcategory_banners || {};
  const subKey = cleanString(subcategorySlug).toLowerCase();
  if (subKey && subMap[subKey] && categoryBannerHasContent(subMap[subKey])) {
    return normalizeCategoryBanner(subMap[subKey]);
  }
  const main = normalizeCategoryBanner(category.banner);
  if (categoryBannerHasContent(main)) return main;

  const fallbackImage = normalizeMediaUrl(category.image || category.imageUrl);
  if (!fallbackImage) return null;
  return {
    ...emptyCategoryBanner(),
    enabled: true,
    image: fallbackImage,
  };
}

export function applyListingBannerFallback(category, publishedMap = HOSTINGER_LISTING_BANNERS) {
  if (!category) return category;
  if (categoryBannerHasContent(category.banner)) return category;
  const published = publishedMap[cleanString(category.slug).toLowerCase()];
  if (categoryBannerHasContent(published)) {
    return { ...category, banner: normalizeCategoryBanner(published) };
  }
  const image = normalizeMediaUrl(category.image || category.imageUrl);
  if (!image) return category;
  return {
    ...category,
    banner: {
      ...emptyCategoryBanner(),
      enabled: true,
      image,
    },
  };
}

export function withListingBannerFallbacks(categories) {
  const list = (Array.isArray(categories) ? categories : []).filter(Boolean);
  if (!list.length) return list;
  return list.map((category) => applyListingBannerFallback(category));
}
