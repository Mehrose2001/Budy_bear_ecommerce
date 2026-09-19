"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { brand } from "@/data/brand";

export default function Hero() {
  return (
    <section className="group relative bg-brand-cream">
      <Link
        href="/products"
        aria-label={`${brand.name} — explore the collection`}
        className="relative block"
      >
        <Image
          src={brand.heroBanner}
          alt={`${brand.name} ${brand.tagline}. ${brand.slogan}`}
          width={4096}
          height={2047}
          quality={100}
          sizes="100vw"
          priority
          className="h-auto w-full"
        />
        <div className="absolute inset-0 bg-brand-primary/0 transition-colors duration-300 group-hover:bg-brand-primary/25 group-focus-within:bg-brand-primary/25" />
        <span className="hero-explore-cta pointer-events-none absolute bottom-4 left-1/2 z-10 w-max -translate-x-1/2 px-4 sm:bottom-6 lg:bottom-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-lg sm:px-8 sm:py-3.5 sm:text-base">
            Explore the collection
            <ArrowRight className="h-4 w-4" />
          </span>
        </span>
      </Link>
    </section>
  );
}
