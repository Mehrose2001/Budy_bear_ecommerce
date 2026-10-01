"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import OrderSlipDownload from "@/components/order/OrderSlipDownload";
import { adminFetch } from "@/lib/adminApi";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUSES } from "@/data/admin";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getCustomerConfirmWhatsAppUrl,
  openCustomerConfirmWhatsApp,
} from "@/lib/orderNotifications";

export default function AdminOrdersPage() {
  const { admin } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [whatsAppPrompt, setWhatsAppPrompt] = useState(null);

  const load = useCallback(async () => {
    if (!admin?.token) return;
    const data = await adminFetch("/api/admin/orders", {}, admin.token);
    setOrders(data.orders);
  }, [admin?.token]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const updateStatus = async (order, orderStatus) => {
    let waWindow = null;
    if (orderStatus === "Confirmed") {
      waWindow = window.open("", "_blank");
    }

    const data = await adminFetch(
      "/api/admin/orders",
      {
        method: "PATCH",
        body: JSON.stringify({ id: order.id, orderStatus }),
      },
      admin.token
    );

    const confirmed = data.order || { ...order, orderStatus };
    if (orderStatus === "Confirmed") {
      const url = getCustomerConfirmWhatsAppUrl(confirmed);
      const name =
        confirmed.customer?.fullName ||
        confirmed.shippingAddress?.fullName ||
        "the customer";
      if (url) {
        setWhatsAppPrompt({ url, name });
        if (waWindow && !waWindow.closed) {
          waWindow.location.href = url;
        } else {
          openCustomerConfirmWhatsApp(confirmed);
        }
      } else if (waWindow && !waWindow.closed) {
        waWindow.close();
      }
    }

    await load();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdminPageHeader
        title="Orders"
        description="Confirming an order opens WhatsApp from your Budy Bear account with a message to the customer. On phone, tap Send on WhatsApp if it does not open by itself."
      />

      {whatsAppPrompt?.url && (
        <div className="mb-4 shrink-0 rounded-2xl border border-brand-accent bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-brand-primary">
            Send the confirmation to {whatsAppPrompt.name} from the Budy Bear WhatsApp
            account.
          </p>
          <a
            href={whatsAppPrompt.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Send on WhatsApp
          </a>
        </div>
      )}

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
              <th className="px-4 py-3 font-medium">WhatsApp</th>
              <th className="px-4 py-3 font-medium">Shipment</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const waUrl = getCustomerConfirmWhatsAppUrl(order);
              return (
                <tr key={order.id} className="border-b border-border/70">
                  <td className="px-4 py-3 font-semibold text-brand-primary">{order.id}</td>
                  <td className="px-4 py-3">
                    <div>{order.customer?.fullName}</div>
                    <div className="text-xs text-neutral-500">{order.customer?.email}</div>
                    <div className="text-xs text-neutral-500">
                      {order.customer?.phone || order.shippingAddress?.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(order.createdAt).toLocaleDateString("en-PK")}
                  </td>
                  <td className="px-4 py-3">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : "Debit / Credit"} ·{" "}
                    {order.paymentStatus}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.orderStatus}
                      onChange={(event) => updateStatus(order, event.target.value)}
                      className="h-11 min-w-[9.5rem] rounded-xl border border-border bg-white px-3"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#25D366] px-3 py-2 text-xs font-semibold text-white"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Message
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400">No phone</span>
                    )}
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
              );
            })}
          </tbody>
        </table>
      </AdminTable>
    </div>
  );
}
