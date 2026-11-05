import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useDeliverySettings } from "@/context/DeliverySettingsContext";
import { LIMITED_TIME_OFFER_LABEL } from "@/lib/storeOffer";

export default function OrderSummary({
  items = [],
  subtotal,
  discount,
  productDiscount,
  saleDiscount,
  offerDiscount,
  couponDiscount,
  couponCode,
  shipping,
  total,
  deliveryMethod,
}) {
  const { freeDeliveryThreshold } = useDeliverySettings();
  const saleOff = Number(saleDiscount ?? 0);
  const offerOff = Number(offerDiscount ?? 0);
  const productOff = Number(productDiscount ?? saleOff + offerOff);
  const promoOff = Number(couponDiscount ?? 0);
  const combined = Number(discount ?? productOff + promoOff);
  const payableSubtotal = Math.max(0, subtotal - offerOff - saleOff);
  const remaining = Math.max(0, freeDeliveryThreshold - payableSubtotal);

  return (
    <aside className="rounded-3xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-black text-neutral-900">Order summary</h2>

      <ul className="mt-5 space-y-4">
        {items.map((item) => {
          const lineTotal = item.unitPrice * item.quantity;
          const lineOriginal = (item.basePrice ?? item.unitPrice) * item.quantity;
          const showOfferLine = item.offerApplied && lineOriginal > lineTotal;
          return (
            <li key={item.id} className="flex gap-3">
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-neutral-900">
                  {item.name}
                </span>
                <span className="text-xs text-neutral-500">
                  {item.color} · {item.size} · Qty {item.quantity}
                </span>
                {showOfferLine ? (
                  <span className="mt-1 block text-xs font-semibold text-brand-primary">
                    {LIMITED_TIME_OFFER_LABEL}
                  </span>
                ) : null}
              </span>
              <span className="text-right text-sm">
                {showOfferLine ? (
                  <>
                    <span className="block text-xs text-neutral-500 line-through">
                      {formatPrice(lineOriginal)}
                    </span>
                    <span className="block font-bold">{formatPrice(lineTotal)}</span>
                  </>
                ) : (
                  <span className="font-bold">{formatPrice(lineTotal)}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="mt-5 space-y-3 border-t border-neutral-200 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-500">Subtotal</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        {saleOff > 0 ? (
          <div className="flex justify-between">
            <dt className="text-neutral-500">Sale discount</dt>
            <dd className="text-brand-primary">-{formatPrice(saleOff)}</dd>
          </div>
        ) : null}
        {offerOff > 0 ? (
          <div className="flex justify-between">
            <dt className="text-neutral-500">{LIMITED_TIME_OFFER_LABEL}</dt>
            <dd className="text-brand-primary">-{formatPrice(offerOff)}</dd>
          </div>
        ) : productOff > 0 && saleOff === 0 && offerOff === 0 ? (
          <div className="flex justify-between">
            <dt className="text-neutral-500">Product discount</dt>
            <dd className="text-brand-primary">-{formatPrice(productOff)}</dd>
          </div>
        ) : null}
        {promoOff > 0 ? (
          <div className="flex justify-between">
            <dt className="text-neutral-500">Promo {couponCode || ""}</dt>
            <dd className="text-brand-primary">-{formatPrice(promoOff)}</dd>
          </div>
        ) : combined > 0 && productOff === 0 && promoOff === 0 ? (
          <div className="flex justify-between">
            <dt className="text-neutral-500">Discount</dt>
            <dd className="text-brand-primary">-{formatPrice(combined)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-neutral-500">
            Delivery {deliveryMethod === "express" ? "(Express)" : ""}
          </dt>
          <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-3 text-base">
          <dt className="font-bold">Total</dt>
          <dd className="font-black">{formatPrice(total)}</dd>
        </div>
      </dl>

      {deliveryMethod !== "express" && remaining > 0 && (
        <p className="mt-4 rounded-xl bg-brand-cream px-3 py-2 text-xs text-neutral-700">
          Add {formatPrice(remaining)} more for free standard delivery.
        </p>
      )}
    </aside>
  );
}
