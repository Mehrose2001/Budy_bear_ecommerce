"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProductImages } from "@/lib/productImages";

const SWIPE_THRESHOLD = 48;

export default function ProductGallery({ product, compact = false, selectedColor }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef(null);
  const images = getProductImages(product, selectedColor);

  useEffect(() => {
    setActiveIndex(0);
  }, [selectedColor, product.id]);

  const goTo = useCallback(
    (index) => {
      if (!images.length) return;
      setActiveIndex(Math.max(0, Math.min(images.length - 1, index)));
    },
    [images.length]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  const onTouchStart = (event) => {
    touchStart.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event) => {
    if (touchStart.current == null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStart.current;
    const delta = endX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  const hasMultiple = images.length > 1;

  return (
    <div className={cn("grid gap-4", compact ? "" : "lg:grid-cols-[88px_minmax(0,1fr)]")}>
      <div
        className={cn(
          "order-2 flex gap-3 overflow-x-auto overscroll-x-contain",
          compact ? "pb-1" : "lg:order-1 lg:max-h-[min(520px,70vh)] lg:flex-col lg:overflow-y-auto lg:overscroll-y-contain"
        )}
      >
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => goTo(index)}
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
          compact ? "aspect-[4/5] max-h-[min(72vh,520px)]" : "aspect-[4/5] lg:order-2"
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={product.name}
          fill
          priority={!compact}
          className={cn(
            "transition-opacity duration-300",
            compact ? "object-contain p-1" : "object-cover"
          )}
          sizes={compact ? "min(100vw, 440px)" : "(max-width: 1024px) 100vw, 50vw"}
          draggable={false}
        />

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={activeIndex === 0}
              className="absolute left-2 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-primary shadow-md disabled:pointer-events-none disabled:opacity-40"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={activeIndex >= images.length - 1}
              className="absolute right-2 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-primary shadow-md disabled:pointer-events-none disabled:opacity-40"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <p className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white">
              {activeIndex + 1} / {images.length}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
