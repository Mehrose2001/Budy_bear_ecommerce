import { cn } from "@/lib/utils";

const variants = {
  sale: "bg-brand-accent text-white",
  new: "bg-brand-secondary text-white",
  featured: "bg-brand-primary text-white",
  default: "bg-neutral-900 text-white",
};

export default function Badge({
  children,
  variant = "default",
  className,
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
