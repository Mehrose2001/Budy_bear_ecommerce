import { cn } from "@/lib/utils";

export default function Loader({
  label = "Loading...",
  className,
  size = "md",
}) {
  const dimension = size === "sm" ? "h-6 w-6 border-[3px]" : "h-11 w-11 border-4";

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          "animate-spin rounded-full border-brand-cream border-t-brand-accent",
          dimension
        )}
      />
      {label ? (
        <span className="text-sm font-semibold text-brand-primary">{label}</span>
      ) : null}
    </div>
  );
}

export function PageLoader({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-brand-cream/40 px-4">
      <Loader label={label} />
    </div>
  );
}

export function ApiLoaderOverlay({ label = "Please wait..." }) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-brand-cream/75 backdrop-blur-[2px]"
      role="alert"
      aria-busy="true"
    >
      <div className="rounded-[1.75rem] border border-border bg-white px-10 py-8 shadow-lg">
        <Loader label={label} />
      </div>
    </div>
  );
}
