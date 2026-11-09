import StarRating from "@/components/ui/StarRating";
import { formatAverageRating, productRatingSummary } from "@/lib/ratings";
import { cn } from "@/lib/utils";

export default function ProductRating({
  product,
  size = "sm",
  className,
  showCount = true,
  showAverageText = false,
}) {
  const { rating, count, hasReviews } = productRatingSummary(product);

  if (!hasReviews) {
    return (
      <p className={cn("text-xs font-medium text-neutral-500", className)}>No reviews yet</p>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <StarRating rating={rating} size={size} count={showCount ? count : undefined} />
      {showAverageText && (
        <span className="text-xs text-neutral-600">
          {formatAverageRating(rating)} average
        </span>
      )}
    </div>
  );
}
