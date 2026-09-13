import StarRating from "@/components/ui/StarRating";
import { getReviewsForProduct } from "@/data/reviews";

export default function ProductReviews({ product }) {
  const reviews = getReviewsForProduct(product);

  return (
    <section id="reviews" className="scroll-mt-36">
      <h2 className="text-2xl font-black text-neutral-900">Reviews</h2>
      <p className="mt-2 text-sm text-neutral-500">
        {product.reviewCount} reviews · {product.rating} average rating
      </p>

      <div className="mt-6 space-y-4">
        {reviews.map((review) => (
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
            <h3 className="mt-3 text-sm font-bold text-neutral-900">
              {review.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {review.comment}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
