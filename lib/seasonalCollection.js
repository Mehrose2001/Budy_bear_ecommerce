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
