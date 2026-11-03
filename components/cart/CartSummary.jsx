import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { FREE_DELIVERY_THRESHOLD } from "@/data/store";
import { LIMITED_TIME_OFFER_LABEL } from "@/lib/storeOffer";

export default function CartSummary({
  subtotal,
  discount,
  saleDiscount = 0,
  offerDiscount = 0,
  shipping,
  total,
  itemCount,
  showCheckout = true,
}) {
  const saleOff = Number(saleDiscount ?? 0);
  const offerOff = Number(offerDiscount ?? 0);
  const combined = Number(discount ?? saleOff + offerOff);
  const payableSubtotal = Math.max(0, subtotal - offerOff);
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - payableSubtotal);

  return (
    <aside className="rounded-3xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-black text-neutral-900">Order summary</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-500">Subtotal ({itemCount} items)</dt>
          <dd className="font-medium">{formatPrice(subtotal)}</dd>
        </div>
        {saleOff > 0 ? (
          <div className="flex justify-between">
            <dt className="text-neutral-500">Sale discount</dt>
            <dd className="font-medium text-brand-primary">-{formatPrice(saleOff)}</dd>
          </div>
        ) : null}
        {offerOff > 0 ? (
          <div className="flex justify-between">
            <dt className="text-neutral-500">{LIMITED_TIME_OFFER_LABEL}</dt>
            <dd className="font-medium text-brand-primary">-{formatPrice(offerOff)}</dd>
          </div>
        ) : combined > 0 && saleOff === 0 ? (
          <div className="flex justify-between">
            <dt className="text-neutral-500">Discount</dt>
            <dd className="font-medium text-brand-primary">-{formatPrice(combined)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-neutral-500">Delivery</dt>
          <dd className="font-medium">
            {shipping === 0 ? "Free" : formatPrice(shipping)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-3 text-base">
          <dt className="font-bold">Total</dt>
          <dd className="font-black">{formatPrice(total)}</dd>
        </div>
      </dl>

      {remaining > 0 ? (
        <p className="mt-4 rounded-xl bg-brand-cream px-3 py-2 text-xs text-neutral-700">
          Add {formatPrice(remaining)} more for free delivery.
        </p>
      ) : (
        <p className="mt-4 rounded-xl bg-brand-cream px-3 py-2 text-xs text-neutral-700">
          You have unlocked free delivery.
        </p>
      )}

      {showCheckout && (
        <div className="mt-6 grid gap-3">
          {itemCount === 0 ? (
            <Button className="w-full" disabled>
              Proceed to Checkout
            </Button>
          ) : (
            <Button href="/checkout" className="w-full">
              Proceed to Checkout
            </Button>
          )}
          <Button href="/products" variant="outline" className="w-full">
            Continue Shopping
          </Button>
        </div>
      )}
    </aside>
  );
}
