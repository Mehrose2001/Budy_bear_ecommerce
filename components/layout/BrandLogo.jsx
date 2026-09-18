import Image from "next/image";
import Link from "next/link";
import { brand } from "@/data/brand";
import { cn } from "@/lib/utils";

export default function BrandLogo({
  size = 52,
  showWordmark = false,
  variant = "default",
  priority = false,
  className,
  onClick,
}) {
  const isLight = variant === "light";

  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn("flex shrink-0 items-center gap-2", className)}
      aria-label={`${brand.name} home`}
    >
      <Image
        src={brand.logo}
        alt={`${brand.name} ${brand.tagline} logo`}
        width={size}
        height={size}
        className="rounded-full bg-white object-cover ring-1 ring-white/20"
        priority={priority}
      />
      {showWordmark && (
        <span className="hidden leading-tight lg:block">
          <span
            className={cn(
              "block text-lg font-black tracking-tight",
              isLight ? "text-white" : "text-brand-primary"
            )}
          >
            {brand.name.split(" ")[0]}{" "}
            <span className="text-brand-accent">{brand.name.split(" ")[1]}</span>
          </span>
          <span
            className={cn(
              "block text-[10px] font-semibold uppercase tracking-[0.22em]",
              isLight ? "text-white/70" : "text-brand-primary/70"
            )}
          >
            {brand.tagline}
          </span>
        </span>
      )}
    </Link>
  );
}
