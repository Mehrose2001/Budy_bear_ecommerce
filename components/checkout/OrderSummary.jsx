import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { FREE_DELIVERY_THRESHOLD } from "@/data/store";

export default function OrderSummary({
  items = [],
  subtotal,
  discount,
  shipping,
  total,
  deliveryMethod,
}) {
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - (subtotal - discount));

  return (
    <aside className="rounded-3xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-black text-neutral-900">Order summary</h2>

      <ul className="mt-5 space-y-4">
        {items.map((item) => (
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
            </span>
            <span className="text-sm font-bold">
              {formatPrice(item.unitPrice * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-3 border-t border-neutral-200 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-500">Subtotal</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">Discount</dt>
          <dd className="text-brand-primary">-{formatPrice(discount)}</dd>
        </div>
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
