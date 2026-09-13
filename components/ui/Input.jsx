import { cn } from "@/lib/utils";

export default function Input({
  label,
  id,
  className,
  inputClassName,
  error,
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
          error && "border-error focus:border-error focus:ring-error/20",
          inputClassName
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
    </div>
  );
}
