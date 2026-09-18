"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import { adminFetch } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminReviewsPage() {
  const { admin } = useAdminAuth();
  const [reviews, setReviews] = useState([]);

  const load = useCallback(async () => {
    if (!admin?.token) return;
    const data = await adminFetch("/api/admin/content?resource=reviews", {}, admin.token);
    setReviews(data.reviews);
  }, [admin?.token]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const setStatus = async (review, status) => {
    await adminFetch(
      "/api/admin/content",
      {
        method: "POST",
        body: JSON.stringify({ resource: "reviews", data: { ...review, status } }),
      },
      admin.token
    );
    await load();
  };

  const remove = async (id) => {
    await adminFetch(`/api/admin/content?resource=reviews&id=${id}`, { method: "DELETE" }, admin.token);
    await load();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdminPageHeader title="Reviews" description="Moderate customer feedback before it stays on product pages." />
      <AdminTable>
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-brand-cream">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Review</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-b border-border/70">
                <td className="px-4 py-3 font-semibold text-brand-primary">{review.productName}</td>
                <td className="px-4 py-3">
                  <div>{review.author || review.name}</div>
                  <div className="text-neutral-600">{review.comment || review.body}</div>
                </td>
                <td className="px-4 py-3">{review.rating}</td>
                <td className="px-4 py-3">
                  <select
                    value={review.status}
                    onChange={(event) => setStatus(review, event.target.value)}
                    className="h-10 rounded-xl border border-border px-3"
                  >
                    <option>Published</option>
                    <option>Hidden</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-sm font-semibold text-error"
                    onClick={() => remove(review.id)}
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
