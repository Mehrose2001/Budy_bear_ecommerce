import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-brand-primary text-white hover:bg-brand-primary-dark shadow-sm hover:shadow-md",
  secondary:
    "bg-white text-brand-primary border border-brand-primary hover:bg-brand-primary hover:text-white",
  outline:
    "border border-neutral-300 bg-white text-neutral-800 hover:border-brand-primary hover:text-brand-primary",
  ghost: "text-neutral-700 hover:bg-neutral-100 hover:text-brand-primary",
  accent:
    "bg-brand-accent text-white hover:bg-brand-accent-dark shadow-sm hover:shadow-md",
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
};

export default function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
