import Image from "next/image";
import { brand } from "@/data/brand";
import { formatPrice } from "@/lib/utils";

export default function OrderReceipt({ order }) {
  const items = order.items || [];
  const dateLabel = new Date(order.createdAt).toLocaleString("en-PK");

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-brand-primary/15 bg-white shadow-lg">
      <header className="bg-brand-primary px-4 py-4 text-white sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Image
            src={brand.logo}
            alt={`${brand.name} logo`}
            width={64}
            height={64}
            className="h-12 w-12 shrink-0 rounded-full bg-white object-cover ring-2 ring-brand-accent sm:h-16 sm:w-16"
          />
          <div className="min-w-0 flex-1 basis-40">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-accent sm:text-xs sm:tracking-[0.2em]">
              {brand.tagline}
            </p>
            <h2 className="text-lg font-black leading-tight sm:text-2xl">{brand.name} receipt</h2>
            <p className="mt-0.5 break-words text-xs leading-5 text-white/75 sm:text-sm">
              Order {order.id} · {dateLabel}
            </p>
          </div>
          <div className="w-fit max-w-full shrink-0 rounded-full bg-brand-accent px-3 py-1.5 text-xs font-bold text-brand-primary-dark sm:px-4">
            Cash on Delivery
          </div>
        </div>
      </header>

      <div className="grid gap-6 border-b border-border px-6 py-5 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-brand-accent">Sender</h3>
          <p className="mt-2 font-black text-brand-primary">{brand.name}</p>
          <p className="text-sm text-neutral-600">{brand.companyAddress}</p>
          <p className="mt-2 text-sm text-neutral-700">
            Phone: <strong>{brand.supportPhone}</strong>
          </p>
          <p className="text-sm text-neutral-700">
            Email: <strong>{brand.supportEmail}</strong>
          </p>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-brand-accent">Receiver</h3>
          <p className="mt-2 font-black text-brand-primary">
            {order.shippingAddress?.fullName || order.customer?.fullName}
          </p>
          <p className="text-sm text-neutral-600">
            {order.shippingAddress?.address}
            <br />
            {order.shippingAddress?.city}, {order.shippingAddress?.province}{" "}
            {order.shippingAddress?.postalCode}
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            Phone: {order.customer?.phone || order.shippingAddress?.phone}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto px-6 py-5">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-primary/20 text-xs uppercase tracking-wide text-brand-primary">
              <th className="py-2 pr-3 font-bold">Item</th>
              <th className="py-2 pr-3 font-bold">Details</th>
              <th className="py-2 pr-3 font-bold">Qty</th>
              <th className="py-2 pr-3 font-bold">Price</th>
              <th className="py-2 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border/70">
                <td className="py-3 pr-3 font-semibold text-neutral-900">{item.name}</td>
                <td className="py-3 pr-3 text-neutral-500">
                  {item.color || "-"} · {item.size || "-"}
                </td>
                <td className="py-3 pr-3">{item.quantity}</td>
                <td className="py-3 pr-3">{formatPrice(item.unitPrice)}</td>
                <td className="py-3 text-right font-semibold">
                  {formatPrice(item.unitPrice * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-5 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-neutral-600">
            <dt>Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-neutral-600">
            <dt>Discount</dt>
            <dd>-{formatPrice(order.discount)}</dd>
          </div>
          <div className="flex justify-between text-neutral-600">
            <dt>Delivery</dt>
            <dd>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-brand-primary/20 pt-2 text-base font-black text-brand-primary">
            <dt>Collect on delivery</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      <footer className="bg-brand-cream px-6 py-4 text-center text-xs text-neutral-600">
        Thank you for shopping with {brand.name}. Status: {order.orderStatus || "Confirmed"}.
      </footer>
    </article>
  );
}
