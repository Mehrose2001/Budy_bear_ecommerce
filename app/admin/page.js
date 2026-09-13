"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Package, Users, Wallet } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminFetch } from "@/lib/adminApi";
import { formatPrice } from "@/lib/utils";
import { useAdminAuth } from "@/context/AdminAuthContext";

const CARDS = [
  { key: "totalSales", label: "Total sales", icon: Wallet },
  { key: "totalOrders", label: "Orders", icon: ClipboardList },
  { key: "customers", label: "Customers", icon: Users },
  { key: "products", label: "Products", icon: Package },
];

export default function AdminDashboardPage() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!admin?.token) return;
    adminFetch("/api/admin/content?resource=stats", {}, admin.token)
      .then(setStats)
      .catch((err) => setError(err.message));
  }, [admin?.token]);

  return (
    <div>
      <AdminPageHeader
        title={`Welcome back, ${admin?.name?.split(" ")[0] || "Admin"}`}
        description="Track sales, orders, and catalog health for Budy Bear."
      />

      {error && <p className="mb-4 text-sm text-error">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key];
          const display =
            card.key === "totalSales"
              ? formatPrice(value || 0)
              : value ?? "—";

          return (
            <div
              key={card.key}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-500">{card.label}</p>
                <span className="rounded-full bg-brand-cream p-2 text-brand-primary">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-brand-primary">{display}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-brand-primary">Recent orders</h3>
          <Link href="/admin/orders" className="text-sm font-semibold text-brand-accent">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-neutral-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Order</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Total</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentOrders || []).map((order) => (
                <tr key={order.id} className="border-b border-border/70">
                  <td className="py-3 pr-4 font-semibold text-brand-primary">{order.id}</td>
                  <td className="py-3 pr-4">{order.customer?.fullName}</td>
                  <td className="py-3 pr-4">{formatPrice(order.total)}</td>
                  <td className="py-3">{order.orderStatus}</td>
                </tr>
              ))}
              {!stats?.recentOrders?.length && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
