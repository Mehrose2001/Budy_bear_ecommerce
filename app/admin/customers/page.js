"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminFetch } from "@/lib/adminApi";
import { formatPrice } from "@/lib/utils";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminCustomersPage() {
  const { admin } = useAdminAuth();
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    if (!admin?.token) return;
    adminFetch("/api/admin/content?resource=customers", {}, admin.token)
      .then((data) => setCustomers(data.customers || []))
      .catch(() => {});
  }, [admin?.token]);

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="Shoppers collected from completed checkout orders."
      />
      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-brand-cream/60">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Spent</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.email} className="border-b border-border/70">
                <td className="px-4 py-3 font-semibold text-brand-primary">{customer.name}</td>
                <td className="px-4 py-3">{customer.email}</td>
                <td className="px-4 py-3">{customer.phone}</td>
                <td className="px-4 py-3">{customer.orders}</td>
                <td className="px-4 py-3">{formatPrice(customer.spent)}</td>
              </tr>
            ))}
            {!customers.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
