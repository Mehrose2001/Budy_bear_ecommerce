import { getShippingCost } from "@/lib/orders";

function lineAmounts(item) {
  const qty = Math.max(1, Number(item?.quantity) || 1);
  const listed = Number(item?.price ?? 0);
  const charged = Number(item?.unitPrice ?? item?.salePrice ?? listed);
  const list = Math.max(listed, charged);
  const sale = Math.min(listed || charged, charged || listed);
  return { qty, list, sale };
}

export function computeCheckoutTotals({
  items = [],
  couponPercent = 0,
  couponDiscount = 0,
  deliveryMethod = "standard",
} = {}) {
  let listSubtotal = 0;
  let saleSubtotal = 0;

  for (const item of items) {
    const { qty, list, sale } = lineAmounts(item);
    listSubtotal += list * qty;
    saleSubtotal += sale * qty;
  }

  const productDiscount = Math.max(0, Math.round(listSubtotal - saleSubtotal));
  const percent = Number(couponPercent) || 0;
  const fromPercent = percent > 0 ? Math.round(saleSubtotal * (percent / 100)) : 0;
  const fromAmount = Math.max(0, Math.round(Number(couponDiscount) || 0));
  const promo = Math.min(saleSubtotal, percent > 0 ? fromPercent : fromAmount);
  const afterPromo = Math.max(0, saleSubtotal - promo);
  const shipping = getShippingCost(afterPromo, deliveryMethod);

  return {
    subtotal: Math.round(listSubtotal),
    productDiscount,
    couponDiscount: promo,
    discount: productDiscount + promo,
    shipping,
    total: afterPromo + shipping,
  };
}
