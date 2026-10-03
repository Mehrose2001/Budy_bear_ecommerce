"use client";

import { useMemo, useState } from "react";
import StarRating from "@/components/ui/StarRating";
import ReviewForm from "@/components/product/ReviewForm";

export default function ProductReviews({ product, reviews = [] }) {
  const [items, setItems] = useState(Array.isArray(reviews) ? reviews : []);
  const [summary, setSummary] = useState({
    rating: Number(product.rating) || 0,
    count: Number(product.reviewCount) || 0,
  });

  const visible = useMemo(
    () => items.filter((review) => review.status !== "Hidden" && review.status !== "Pending"),
    [items]
  );

  const handleCreated = (review) => {
    if (!review) return;
    setItems((current) => [review, ...current.filter((item) => item.id !== review.id)]);
    setSummary((current) => {
      const count = current.count + 1;
      const rating = Math.round(((current.rating * current.count + Number(review.rating)) / count) * 100) / 100;
      return { count, rating };
    });
  };

  return (
    <section id="reviews" className="scroll-mt-36">
      <h2 className="text-2xl font-black text-neutral-900">Reviews</h2>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <StarRating rating={summary.rating} size="md" count={summary.count} />
        <p className="text-sm text-neutral-500">
          {summary.count} review{summary.count === 1 ? "" : "s"} · {summary.rating || 0} average
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-8 text-sm text-neutral-500">
            Be the first to review this product.
          </p>
        ) : (
          visible.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-neutral-900">{review.author}</p>
                  <p className="text-xs text-neutral-500">{review.date}</p>
                </div>
                <StarRating rating={review.rating} />
              </div>
              {review.title ? (
                <h3 className="mt-3 text-sm font-bold text-neutral-900">{review.title}</h3>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-neutral-600">{review.comment}</p>
            </article>
          ))
        )}
      </div>
      <ReviewForm productId={product.id} onCreated={handleCreated} />
    </section>
  );
}
