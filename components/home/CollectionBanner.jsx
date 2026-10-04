import Image from "next/image";
import Button from "@/components/ui/Button";
import { getSeasonalCollection } from "@/lib/seasonalCollection";
import { cn } from "@/lib/utils";

export default function CollectionBanner({ season = "winter" }) {
  const collection = getSeasonalCollection(season);
  const isSummer = collection.id === "summer";

  return (
    <section className="bg-brand-cream">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          className={cn(
            "overflow-hidden rounded-[2rem] shadow-xl ring-1",
            isSummer
              ? "bg-[#2F6B73] ring-[#2F6B73]/40"
              : "bg-brand-primary ring-brand-accent/30"
          )}
        >
          <div className="grid lg:grid-cols-2">
            <div
              className={cn(
                "relative min-h-[320px] lg:min-h-[420px]",
                isSummer ? "bg-[#24555C]" : "bg-brand-primary-dark"
              )}
            >
              <Image
                src={collection.image}
                alt={collection.label}
                fill
                className="object-cover"
              />
            </div>
            <div
              className={cn(
                "flex flex-col justify-center px-8 py-12 sm:px-12",
                isSummer ? "bg-[#2F6B73]" : "bg-brand-primary"
              )}
            >
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-accent">
                Seasonal Collection
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {collection.label}
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-brand-cream/80">
                {collection.bannerCopy}
              </p>
              <div className="mt-8">
                <Button
                  href="/products?new=true"
                  size="lg"
                  variant="accent"
                >
                  New arrivals
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
