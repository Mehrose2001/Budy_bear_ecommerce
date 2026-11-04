export const SEASONAL_COLLECTIONS = {
  winter: {
    id: "winter",
    label: "Winter collection",
    description: "New arrival styles for the winter season.",
    bannerCopy: "Cozy layers, warm fabrics, and everyday kidswear for cooler days.",
    image: "/images/banners/winter-collection.svg",
  },
  summer: {
    id: "summer",
    label: "Summer collection",
    description: "New arrival styles for the summer season.",
    bannerCopy: "Light fabrics, bright colours, and easy outfits for sunny days.",
    image: "/images/banners/summer-collection.svg",
  },
};

export function normalizeSeasonalCollection(value) {
  return String(value || "").toLowerCase() === "summer" ? "summer" : "winter";
}

export function getSeasonalCollection(value) {
  return SEASONAL_COLLECTIONS[normalizeSeasonalCollection(value)];
}

const MARKETING_TEXT_LIMIT = 180;

function bannerEntry(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    image: String(source.image || source.backgroundImage || "").trim(),
    text: String(source.text || source.marketingText || "")
      .trim()
      .slice(0, MARKETING_TEXT_LIMIT),
  };
}

export function emptySeasonalBanners() {
  return {
    winter: { image: "", text: "" },
    summer: { image: "", text: "" },
  };
}

export function seasonalBannerHasContent(value) {
  const banners = normalizeSeasonalBanners(value);
  return Object.values(banners).some((entry) => entry.image || entry.text);
}

export function normalizeSeasonalBanners(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    winter: bannerEntry(source.winter),
    summer: bannerEntry(source.summer),
  };
}

export function seasonalBannerFor(banners, season) {
  return normalizeSeasonalBanners(banners)[normalizeSeasonalCollection(season)];
}
