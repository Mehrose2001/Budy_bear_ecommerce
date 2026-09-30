"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import OrderReceipt from "@/components/order/OrderReceipt";
import OrderSlipDownload from "@/components/order/OrderSlipDownload";
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

      <div className="mt-8">
        <OrderReceipt order={order} />
      </div>

      {order.paymentMethod === "cod" && (
        <p className="mt-6 rounded-2xl bg-brand-cream px-5 py-4 text-sm text-neutral-700">
          Pay <strong>{formatPrice(order.total)}</strong> in cash when your parcel
          arrives. Download your receipt below for your records.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <OrderSlipDownload order={order} label="Download receipt" />
        <Button href="/products">Continue Shopping</Button>
        <Button href="/wishlist" variant="outline">
          View favourites
        </Button>
      </div>
    </div>
  );
}
