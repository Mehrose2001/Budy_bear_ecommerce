import { getShippingCost } from "@/lib/orders";
import { isOfferActive, payableUnitPrice } from "@/lib/storeOffer";

function lineAmounts(item, offer) {
  const qty = Math.max(1, Number(item?.quantity) || 1);
  const listed = Number(item?.price ?? 0);
  const base = Number(item?.basePrice ?? item?.salePrice ?? listed);
  const charged = isOfferActive(offer)
    ? payableUnitPrice({ ...item, basePrice: base }, offer)
    : Number(item?.unitPrice ?? base);
  return { qty, list: listed, base, charged };
}

export function computeCheckoutTotals({
  items = [],
  offer = null,
  couponPercent = 0,
  couponDiscount = 0,
  deliveryMethod = "standard",
  deliverySettings = null,
} = {}) {
  let listSubtotal = 0;
  let baseSubtotal = 0;
  let payableSubtotal = 0;

  for (const item of items) {
    const { qty, list, base, charged } = lineAmounts(item, offer);
    listSubtotal += list * qty;
    baseSubtotal += base * qty;
    payableSubtotal += charged * qty;
  }

  const saleDiscount = Math.max(0, Math.round(listSubtotal - baseSubtotal));
  const offerDiscount = Math.max(0, Math.round(baseSubtotal - payableSubtotal));
  const productDiscount = saleDiscount + offerDiscount;
  const percent = Number(couponPercent) || 0;
  const fromPercent = percent > 0 ? Math.round(payableSubtotal * (percent / 100)) : 0;
  const fromAmount = Math.max(0, Math.round(Number(couponDiscount) || 0));
  const promo = Math.min(payableSubtotal, percent > 0 ? fromPercent : fromAmount);
  const afterPromo = Math.max(0, payableSubtotal - promo);
  const shipping = getShippingCost(afterPromo, deliveryMethod, deliverySettings);

  return {
    subtotal: Math.round(listSubtotal),
    productDiscount,
    saleDiscount,
    offerDiscount,
    couponDiscount: promo,
    discount: productDiscount + promo,
    shipping,
    total: afterPromo + shipping,
  };
}
