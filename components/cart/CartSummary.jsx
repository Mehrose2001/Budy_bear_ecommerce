import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { FREE_DELIVERY_THRESHOLD } from "@/data/store";

export default function CartSummary({
  subtotal,
  discount,
  shipping,
  total,
  itemCount,
  showCheckout = true,
}) {
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - (subtotal - discount));

  return (
    <aside className="rounded-3xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-black text-neutral-900">Order summary</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-500">Subtotal ({itemCount} items)</dt>
          <dd className="font-medium">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">Discount</dt>
          <dd className="font-medium text-brand-primary">
            -{formatPrice(discount)}
          </dd>
        </div>
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
