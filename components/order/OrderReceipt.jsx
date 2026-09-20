import Image from "next/image";
import { brand } from "@/data/brand";
import { formatPrice } from "@/lib/utils";

export default function OrderReceipt({ order }) {
  const items = order.items || [];
  const dateLabel = new Date(order.createdAt).toLocaleString("en-PK");

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-brand-primary/15 bg-white shadow-lg">
      <header className="flex flex-wrap items-center gap-4 bg-brand-primary px-6 py-5 text-white">
        <Image
          src={brand.logo}
          alt={`${brand.name} logo`}
          width={64}
          height={64}
          className="rounded-full bg-white object-cover ring-2 ring-brand-accent"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent">
            {brand.tagline}
          </p>
          <h2 className="text-2xl font-black">{brand.name} receipt</h2>
          <p className="text-sm text-white/75">
            Order {order.id} · {dateLabel}
          </p>
        </div>
        <div className="rounded-full bg-brand-accent px-4 py-1.5 text-xs font-bold text-brand-primary-dark">
          Cash on Delivery
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
