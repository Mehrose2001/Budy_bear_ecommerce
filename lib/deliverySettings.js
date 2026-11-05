import {
  EXPRESS_SHIPPING_FEE,
  FREE_DELIVERY_THRESHOLD,
  SHIPPING_FEE,
} from "@/data/store";

export const DEFAULT_DELIVERY_SETTINGS = {
  deliveryFee: SHIPPING_FEE,
  freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
};

export function normalizeDeliverySettings(input) {
  const rawFee =
    input?.deliveryFee ??
    input?.deliveryAmount ??
    input?.delivery_fee ??
    input?.delivery_amount;
  const rawThreshold =
    input?.freeDeliveryThreshold ??
    input?.freeDeliveryMin ??
    input?.amountAfterDeliveryApplied ??
    input?.free_delivery_threshold;

  const deliveryFee = Math.max(
    0,
    Math.round(Number(rawFee ?? DEFAULT_DELIVERY_SETTINGS.deliveryFee))
  );
  const freeDeliveryThreshold = Math.max(
    0,
    Math.round(Number(rawThreshold ?? DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold))
  );

  return { deliveryFee, freeDeliveryThreshold };
}

export function resolveShippingCost(
  discountedSubtotal,
  deliveryMethod = "standard",
  deliveryInput = null
) {
  const { deliveryFee, freeDeliveryThreshold } = normalizeDeliverySettings(deliveryInput);
  if (deliveryMethod === "express") {
    return EXPRESS_SHIPPING_FEE;
  }
  const subtotal = Math.max(0, Number(discountedSubtotal) || 0);
  if (subtotal === 0 || subtotal >= freeDeliveryThreshold) {
    return 0;
  }
  return deliveryFee;
}
