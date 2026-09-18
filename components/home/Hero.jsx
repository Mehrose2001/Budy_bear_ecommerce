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
          width={2560}
          height={1278}
          quality={95}
          sizes="100vw"
          priority
          className="h-auto w-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-primary/0 transition-colors duration-300 group-hover:bg-brand-primary/10" />
        <span className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4 opacity-100 transition-all duration-300 sm:bottom-10 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-lg sm:px-8 sm:py-3.5 sm:text-base">
            Explore the collection
            <ArrowRight className="h-4 w-4" />
          </span>
        </span>
      </Link>
    </section>
  );
}
