import Image from "next/image";
import Button from "@/components/ui/Button";

export default function CollectionBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] bg-brand-primary-dark shadow-xl">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[320px] lg:min-h-[420px]">
            <Image
              src="/images/banners/winter-collection.svg"
              alt="Winter 26 Collection"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center px-8 py-12 sm:px-12">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-accent">
              Seasonal Collection
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Winter &apos;26 Collection
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/75">
              Cozy layers, vibrant hues, and trend-forward designs for the
              season ahead.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/category/boys?new=true" size="lg" variant="accent">
                Shop Boys
              </Button>
              <Button href="/category/girls?new=true" size="lg" variant="onDark">
                Shop Girls
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
