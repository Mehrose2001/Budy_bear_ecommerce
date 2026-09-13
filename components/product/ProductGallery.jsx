"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ProductGallery({ product, compact = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = product.images.length ? product.images : ["/images/products/product-1.svg"];

  return (
    <div className={cn("grid gap-4", compact ? "" : "lg:grid-cols-[88px_minmax(0,1fr)]")}>
      <div
        className={cn(
          "order-2 flex gap-3 overflow-x-auto",
          compact ? "" : "lg:order-1 lg:flex-col"
        )}
      >
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-neutral-200",
              activeIndex === index && "ring-2 ring-brand-primary"
            )}
            aria-label={`View image ${index + 1}`}
            aria-pressed={activeIndex === index}
          >
            <Image src={image} alt="" fill className="object-cover" sizes="64px" />
          </button>
        ))}
      </div>

      <div
        className={cn(
          "relative order-1 overflow-hidden rounded-3xl bg-neutral-100",
          compact ? "aspect-square" : "aspect-[4/5] lg:order-2"
        )}
      >
        <Image
          src={images[activeIndex]}
          alt={product.name}
          fill
          priority={!compact}
          className="object-cover"
          sizes={compact ? "400px" : "(max-width: 1024px) 100vw, 50vw"}
        />
      </div>
    </div>
  );
}
