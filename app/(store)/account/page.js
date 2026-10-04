"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatPrice } from "@/lib/utils";

export default function AccountPage() {
  const router = useRouter();
  const { user, isReady, isAuthenticated, authHeaders, logout } = useCustomerAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isReady, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/orders/mine", { headers: authHeaders })
      .then((response) => response.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]));
  }, [authHeaders, isAuthenticated]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-neutral-500">Loading account...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900">My account</h1>
          <p className="mt-2 text-neutral-600">{user.name || "Customer"}</p>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-black text-neutral-900">Orders</h2>
        {orders.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-neutral-500">
            No orders yet.{" "}
            <Link href="/products" className="font-semibold text-brand-primary">
              Shop the collection
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {orders.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <Link
                    href={`/order/${order.id}`}
                    className="font-semibold text-brand-primary"
                  >
                    {order.id}
                  </Link>
                  <p className="text-sm text-neutral-500">{order.orderStatus}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold">{formatPrice(order.total)}</p>
                  <Link
                    href={`/track-order?id=${encodeURIComponent(order.id)}`}
                    className="text-sm font-semibold text-brand-primary"
                  >
                    Track
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
