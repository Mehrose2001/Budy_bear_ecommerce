"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminFetch } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminCouponsPage() {
  const { admin } = useAdminAuth();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({
    code: "",
    label: "",
    discountPercent: 10,
    minOrder: 2000,
    active: true,
  });

  const load = useCallback(async () => {
    if (!admin?.token) return;
    const data = await adminFetch("/api/admin/content?resource=coupons", {}, admin.token);
    setCoupons(data.coupons);
  }, [admin?.token]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const save = async (event) => {
    event.preventDefault();
    await adminFetch(
      "/api/admin/content",
      {
        method: "POST",
        body: JSON.stringify({ resource: "coupons", data: form }),
      },
      admin.token
    );
    setForm({ code: "", label: "", discountPercent: 10, minOrder: 2000, active: true });
    await load();
  };

  const remove = async (id) => {
    await adminFetch(`/api/admin/content?resource=coupons&id=${id}`, { method: "DELETE" }, admin.token);
    await load();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdminPageHeader title="Coupons" description="Create discount codes for checkout promotions." />
      <form
        onSubmit={save}
        className="mb-6 grid shrink-0 gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm md:grid-cols-2"
      >
        <Input
          label="Code"
          value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
          required
        />
        <Input
          label="Label"
          value={form.label}
          onChange={(event) => setForm({ ...form, label: event.target.value })}
          required
        />
        <Input
          label="Discount %"
          type="number"
          min="1"
          value={form.discountPercent}
          onChange={(event) => setForm({ ...form, discountPercent: Number(event.target.value) })}
        />
        <Input
          label="Min order (PKR)"
          type="number"
          min="0"
          value={form.minOrder}
          onChange={(event) => setForm({ ...form, minOrder: Number(event.target.value) })}
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm({ ...form, active: event.target.checked })}
          />
          Active
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Save coupon</Button>
        </div>
      </form>

      <AdminTable>
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-brand-cream">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Offer</th>
              <th className="px-4 py-3 font-medium">Min order</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-border/70">
                <td className="px-4 py-3 font-semibold text-brand-primary">{coupon.code}</td>
                <td className="px-4 py-3">
                  {coupon.label} · {coupon.discountPercent}%
                </td>
                <td className="px-4 py-3">{coupon.minOrder}</td>
                <td className="px-4 py-3">{coupon.active ? "Active" : "Off"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-sm font-semibold text-brand-primary"
                    onClick={() => setForm(coupon)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ml-3 text-sm font-semibold text-error"
                    onClick={() => remove(coupon.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
    </div>
  );
}
