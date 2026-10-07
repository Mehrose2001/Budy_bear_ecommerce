"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import { adminFetch } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { REVIEW_STATUS, TESTIMONIAL_LIMIT } from "@/lib/reviewStatus";

const STATUS_OPTIONS = [
  { value: REVIEW_STATUS.PENDING, label: "Pending" },
  { value: REVIEW_STATUS.PUBLISHED, label: "Published" },
  { value: REVIEW_STATUS.TESTIMONIAL, label: "Published in Testimonials" },
  { value: REVIEW_STATUS.HIDDEN, label: "Hidden" },
];

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
        body: JSON.stringify({ resource: "reviews", data: { id: review.id, status } }),
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
    <div className="flex min-h-0 flex-col">
      <AdminPageHeader
        title="Reviews"
        description={`Moderate product reviews. Choose Published in Testimonials for up to ${TESTIMONIAL_LIMIT} reviews on the homepage.`}
      />
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
                    className="h-10 max-w-[14rem] rounded-xl border border-border px-3"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
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
