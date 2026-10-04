"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import OrderTracker from "@/components/order/OrderTracker";
import { formatPrice } from "@/lib/utils";
import { readLocalOrders } from "@/lib/storage";
import {
  orderPhone,
  phonesMatch,
  toPublicTrackOrder,
} from "@/lib/orderTracking";

export default function TrackOrderForm() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(() => searchParams.get("id") || "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const result = useMemo(() => toPublicTrackOrder(order), [order]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setOrder(null);
    const id = String(orderId || "").trim();
    const mobile = String(phone || "").trim();
    if (!id || !mobile) {
      setError("Enter your order ID and the phone number used at checkout.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, phone: mobile }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.order) {
        setOrder(data.order);
        return;
      }

      const local = readLocalOrders().find(
        (item) => String(item.id).toLowerCase() === id.toLowerCase()
      );
      if (local && phonesMatch(orderPhone(local), mobile)) {
        setOrder(local);
        return;
      }

      setError(data.error || "We could not find an order with those details.");
    } catch {
      setError("Unable to track this order right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-sm">
        <Input
          label="Order ID"
          name="orderId"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          placeholder="BB-1001"
          required
        />
        <Input
          label="Phone number"
          name="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="03XX XXXXXXX"
          required
        />
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Track order"}
        </Button>
      </form>

      {result ? (
        <div className="mt-8 rounded-3xl border border-border bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-brand-primary">Order {result.id}</p>
          <h2 className="mt-1 text-2xl font-black text-neutral-900">Order status</h2>
          <p className="mt-2 text-sm text-neutral-500">
            {result.paymentMethod === "cod" ? "Cash on Delivery" : "Card"} · {formatPrice(result.total)}
          </p>
          <div className="mt-8">
            <OrderTracker status={result.orderStatus} />
          </div>
          {result.items?.length ? (
            <ul className="mt-8 divide-y divide-neutral-100 border-t border-neutral-100 pt-4 text-sm">
              {result.items.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex justify-between gap-4 py-2">
                  <span>
                    {item.name}
                    {item.size || item.color
                      ? ` · ${[item.color, item.size].filter(Boolean).join(" / ")}`
                      : ""}
                  </span>
                  <span className="text-neutral-500">x{item.quantity}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
