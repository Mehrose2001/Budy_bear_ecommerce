import Image from "next/image";
import Link from "next/link";
import { brand } from "@/data/brand";

export default function Hero() {
  return (
    <section className="bg-brand-cream">
      <Link
        href="/products"
        aria-label={`${brand.name} — explore the collection`}
        className="relative block"
      >
        <Image
          src={brand.heroBanner}
          alt={`${brand.name} ${brand.tagline}. ${brand.slogan}`}
          width={1920}
          height={900}
          priority
          className="h-auto w-full object-cover"
        />
      </Link>
    </section>
  );
}
