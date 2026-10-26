export const EMPTY_OFFER = {
  enabled: false,
  message: "",
  percent: 0,
};

export function normalizeOffer(value) {
  const source = value && typeof value === "object" ? value : {};
  const percent = Math.min(90, Math.max(0, Math.round(Number(source.percent) || 0)));
  return {
    enabled: Boolean(source.enabled),
    message: String(source.message || "").trim().slice(0, 280),
    percent,
  };
}

export function isOfferActive(offer) {
  return Boolean(offer?.enabled && Number(offer.percent) > 0);
}

export function priceWithOffer(product, offer) {
  const list = Number(product?.price) || 0;
  const sale = Number(product?.salePrice);
  const current = Number.isFinite(sale) && sale > 0 && sale < list ? sale : list;
  if (!isOfferActive(offer)) {
    return { list, current, payable: current, offerPercent: 0 };
  }
  const payable = Math.max(0, Math.round(current * (1 - Number(offer.percent) / 100)));
  return {
    list,
    current,
    payable,
    offerPercent: Number(offer.percent),
  };
}

export function offerHeadline(offer) {
  if (!isOfferActive(offer)) return "";
  if (offer.message) return offer.message;
  return `${offer.percent}% off every product`;
}
