import { cn } from "@/lib/utils";

export default function StarRating({
  rating = 0,
  size = "sm",
  count,
  animated = false,
  onChange,
}) {
  const iconClass = size === "md" ? "h-5 w-5" : size === "lg" ? "h-6 w-6" : "h-3.5 w-3.5";
  const interactive = typeof onChange === "function";
  const value = Number(rating) || 0;

  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(value);
        const star = (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={cn(
              iconClass,
              filled ? "fill-current" : "fill-none text-neutral-300",
              animated && filled && "testimonial-star"
            )}
            style={
              animated && filled ? { animationDelay: `${index * 0.18}s` } : undefined
            }
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );

        if (!interactive) {
          return <span key={index}>{star}</span>;
        }

        return (
          <button
            key={index}
            type="button"
            className="rounded-md p-0.5 transition hover:scale-110"
            onClick={() => onChange(index + 1)}
            aria-label={`${index + 1} star${index === 0 ? "" : "s"}`}
            aria-pressed={index < value}
          >
            {star}
          </button>
        );
      })}
      {typeof count === "number" && (
        <span className="ml-1 text-xs text-neutral-500">({count})</span>
      )}
      <span className="sr-only">{value} out of 5 stars</span>
    </div>
  );
}
