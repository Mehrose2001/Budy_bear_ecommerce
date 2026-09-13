import { cn } from "@/lib/utils";

export default function StarRating({ rating = 0, size = "sm", count }) {
  const iconClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={cn(
            iconClass,
            index < Math.round(rating)
              ? "fill-current"
              : "fill-none text-neutral-300"
          )}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      {typeof count === "number" && (
        <span className="ml-1 text-xs text-neutral-500">({count})</span>
      )}
      <span className="sr-only">{rating} out of 5 stars</span>
    </div>
  );
}
