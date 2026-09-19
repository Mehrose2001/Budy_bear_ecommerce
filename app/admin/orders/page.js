"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import OrderSlipDownload from "@/components/order/OrderSlipDownload";
import { adminFetch } from "@/lib/adminApi";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUSES } from "@/data/admin";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminOrdersPage() {
  const { admin } = useAdminAuth();
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    if (!admin?.token) return;
    const data = await adminFetch("/api/admin/orders", {}, admin.token);
    setOrders(data.orders);
  }, [admin?.token]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const updateStatus = async (id, orderStatus) => {
    await adminFetch(
      "/api/admin/orders",
      {
        method: "PATCH",
        body: JSON.stringify({ id, orderStatus }),
      },
      admin.token
    );
    await load();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdminPageHeader
        title="Orders"
        description="Review incoming orders and update fulfillment status."
      />
      <AdminTable>
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-brand-cream">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Shipment</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border/70">
                <td className="px-4 py-3 font-semibold text-brand-primary">{order.id}</td>
                <td className="px-4 py-3">
                  <div>{order.customer?.fullName}</div>
                  <div className="text-xs text-neutral-500">{order.customer?.email}</div>
                </td>
                <td className="px-4 py-3">
                  {new Date(order.createdAt).toLocaleDateString("en-PK")}
                </td>
                <td className="px-4 py-3">{formatPrice(order.total)}</td>
                <td className="px-4 py-3">
                  {order.paymentMethod === "cod" ? "Cash on Delivery" : "Debit / Credit"} · {order.paymentStatus}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.orderStatus}
                    onChange={(event) => updateStatus(order.id, event.target.value)}
                    className="h-10 rounded-xl border border-border bg-white px-3"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <OrderSlipDownload
                    order={order}
                    variant="outline"
                    size="sm"
                    label="Download slip"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
    </div>
  );
}
