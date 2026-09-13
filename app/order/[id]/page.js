"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import { BANK_DETAILS } from "@/data/checkout";
import { readLocalOrders } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";

export default function OrderConfirmationPage() {
  const params = useParams();
  const id = params?.id;
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data.order);
          return;
        }
      } catch {
        // Fall back to locally saved guest orders.
      }

      const local = readLocalOrders().find((item) => item.id === id);
      if (local) {
        setOrder(local);
      } else {
        setError("We could not find this order.");
      }
    };

    load();
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black">Order not found</h1>
        <p className="mt-3 text-neutral-600">{error}</p>
        <Button href="/products" className="mt-6">
          Continue Shopping
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-neutral-200" />
        <div className="mt-6 h-48 animate-pulse rounded-3xl bg-neutral-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Order confirmation" },
        ]}
      />
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
        Thank you
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-900">
        Order {order.id} placed
      </h1>
      <p className="mt-3 text-neutral-600">
        Status: <strong>{order.orderStatus}</strong> · Payment:{" "}
        <strong>{order.paymentStatus}</strong>
      </p>

      <section className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6">
        <h2 className="font-black text-neutral-900">Items</h2>
        <ul className="mt-4 space-y-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span className="relative h-16 w-16 overflow-hidden rounded-xl bg-neutral-100">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{item.name}</span>
                <span className="text-sm text-neutral-500">
                  {item.color} · {item.size} · Qty {item.quantity}
                </span>
              </span>
              <span className="font-bold">
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-neutral-200 pt-4 text-sm">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span>Discount</span>
            <span>-{formatPrice(order.discount)}</span>
          </p>
          <p className="flex justify-between">
            <span>Delivery</span>
            <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
          </p>
          <p className="mt-2 flex justify-between text-base font-black">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6">
        <h2 className="font-black text-neutral-900">Delivery to</h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          {order.shippingAddress.fullName}
          <br />
          {order.shippingAddress.address}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
          {order.shippingAddress.postalCode}
          <br />
          {order.customer.phone}
        </p>
      </section>

      {order.paymentMethod === "cod" && (
        <p className="mt-6 rounded-2xl bg-brand-cream px-5 py-4 text-sm text-neutral-700">
          Pay <strong>{formatPrice(order.total)}</strong> in cash when your parcel
          arrives.
        </p>
      )}

      {order.paymentMethod === "bank-transfer" && (
        <section className="mt-6 rounded-2xl bg-brand-cream px-5 py-4 text-sm text-neutral-700">
          <p className="font-semibold">Complete your bank transfer using:</p>
          <p className="mt-2">{BANK_DETAILS.accountTitle}</p>
          <p>{BANK_DETAILS.bank}</p>
          <p>Account: {BANK_DETAILS.accountNumber}</p>
          <p>IBAN: {BANK_DETAILS.iban}</p>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/products">Continue Shopping</Button>
        <Button href="/wishlist" variant="outline">
          View favourites
        </Button>
      </div>
    </div>
  );
}
