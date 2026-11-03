import { isOnSale, isSaleListing } from "@/lib/productFilters";

export const OFFER_SECTION_KEYS = ["newArrivals", "saleItems", "featuredItems"];

export const EMPTY_OFFER = {
  enabled: false,
  message: "",
  percent: 0,
  image: "",
  newArrivals: false,
  saleItems: false,
  featuredItems: false,
};

export const LIMITED_TIME_OFFER_LABEL = "Limited Time Offer Discount";

export function normalizeOffer(value) {
  const source = value && typeof value === "object" ? value : {};
  const percent = Math.min(90, Math.max(0, Math.round(Number(source.percent) || 0)));
  const nested = source.sections && typeof source.sections === "object" ? source.sections : source;
  return {
    enabled: Boolean(source.enabled),
    message: String(source.message || "").trim().slice(0, 280),
    percent,
    image: String(source.image || "").trim(),
    newArrivals: Boolean(nested.newArrivals),
    saleItems: Boolean(nested.saleItems),
    featuredItems: Boolean(nested.featuredItems),
  };
}

export function offerSessionSignature(offer) {
  const normalized = normalizeOffer(offer);
  const sections = OFFER_SECTION_KEYS.map((key) => (normalized[key] ? "1" : "0")).join("");
  return `${normalized.percent}:${normalized.message}:${normalized.image}:${sections}`;
}

export function isOfferActive(offer) {
  return Boolean(offer?.enabled && Number(offer.percent) > 0);
}

export function offerTargetsAnySection(offer) {
  const normalized = normalizeOffer(offer);
  return OFFER_SECTION_KEYS.some((key) => normalized[key]);
}

export function productMatchesOfferSections(product, offer) {
  const normalized = normalizeOffer(offer);
  if (!offerTargetsAnySection(normalized)) {
    return true;
  }
  return (
    (normalized.newArrivals && Boolean(product?.newArrival)) ||
    (normalized.saleItems && isSaleListing(product)) ||
    (normalized.featuredItems && Boolean(product?.featured))
  );
}

export function isOfferEligibleProduct(product, offer) {
  return isOfferActive(offer) && productMatchesOfferSections(product, offer);
}

export function priceWithOffer(product, offer) {
  const list = Number(product?.price) || 0;
  const sale = Number(product?.salePrice);
  const current = Number.isFinite(sale) && sale > 0 && sale < list ? sale : list;
  if (!isOfferEligibleProduct(product, offer)) {
    return {
      list,
      current,
      payable: current,
      offerPercent: 0,
      offerApplied: false,
    };
  }
  const payable = Math.max(0, Math.round(current * (1 - Number(offer.percent) / 100)));
  return {
    list,
    current,
    payable,
    offerPercent: Number(offer.percent),
    offerApplied: payable < current,
  };
}

export function offerHeadline(offer) {
  if (!isOfferActive(offer)) return "";
  if (offer.message) return offer.message;
  return `${offer.percent}% off selected products`;
}

export function cartItemOfferEligibility(item, offer) {
  return isOfferEligibleProduct(
    {
      price: item?.price,
      salePrice: item?.salePrice,
      newArrival: item?.newArrival,
      featured: item?.featured,
      bestSeller: item?.bestSeller,
    },
    offer
  );
}

export function payableUnitPrice(item, offer) {
  const base = Number(item.basePrice ?? item.unitPrice ?? item.salePrice ?? item.price) || 0;
  if (!cartItemOfferEligibility(item, offer)) return base;
  return Math.max(0, Math.round(base * (1 - Number(offer.percent) / 100)));
}
