import { cn } from "@/lib/utils";

function StarIcon({ className, filled, half }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="half-fill">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={
          filled
            ? "currentColor"
            : half
              ? "url(#half-fill)"
              : "transparent"
        }
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export default function StarRating({
  rating = 0,
  size = "sm",
  count,
  animated = false,
  onChange,
}) {
  const iconClass =
    size === "md" ? "h-5 w-5" : size === "lg" ? "h-6 w-6" : "h-3.5 w-3.5";
  const interactive = typeof onChange === "function";
  const value = Math.min(5, Math.max(0, Number(rating) || 0));

  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const filled = value >= starValue;
        const half = !filled && value >= starValue - 0.5 && value < starValue;
        const star = (
          <span
            className={cn(
              filled || half ? "text-amber-500" : "text-neutral-300",
              animated && filled && "testimonial-star"
            )}
            style={
              animated && filled ? { animationDelay: `${index * 0.18}s` } : undefined
            }
          >
            <StarIcon className={cn(iconClass, "block")} filled={filled} half={half} />
          </span>
        );

        if (!interactive) {
          return <span key={index}>{star}</span>;
        }

        return (
          <button
            key={index}
            type="button"
            className="rounded-md p-0.5 text-amber-500 transition hover:scale-110"
            onClick={() => onChange(starValue)}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            aria-pressed={starValue <= value}
          >
            {star}
          </button>
        );
      })}
      {typeof count === "number" && count > 0 && (
        <span className="ml-1 text-xs text-neutral-500">({count})</span>
      )}
    </div>
  );
}
