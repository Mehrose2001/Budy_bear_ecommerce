import Image from "next/image";
import Button from "@/components/ui/Button";

export default function PromoBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem]">
        <Image
          src="/images/banners/promo.svg"
          alt="Little Things. Big Smiles."
          width={1400}
          height={400}
          className="h-[280px] w-full object-cover sm:h-[340px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-secondary/80 to-brand-primary/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Little Things. Big Smiles.
          </h2>
          <p className="mt-3 max-w-xl text-white/90">
            Thoughtfully chosen products that make everyday moments special.
          </p>
          <Button
            href="/products"
            variant="secondary"
            size="lg"
            className="mt-8 border-white text-white hover:bg-white hover:text-neutral-900"
          >
            Shop Now
          </Button>
        </div>
      </div>
    </section>
  );
}
