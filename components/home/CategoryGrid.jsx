"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { shopCategories } from "@/data/navigation";
import { cn } from "@/lib/utils";

function toCards(categories) {
  if (categories?.length) {
    return categories.map((category) => ({
      label: category.name || category.label,
      href: category.href || `/category/${category.slug}`,
      image: category.image || "/images/categories/gifts.jpg",
      objectPosition: category.objectPosition || "center top",
    }));
  }
  return shopCategories;
}

function CategoryCard({ category, isDuplicate, onCardClick }) {
  const className =
    "group w-40 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border sm:w-52 sm:rounded-3xl";

  return (
    <Link
      href={category.href}
      className={className}
      tabIndex={isDuplicate ? -1 : undefined}
      aria-hidden={isDuplicate ? true : undefined}
      onClick={onCardClick}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#eaf0f6]">
        <Image
          src={category.image}
          alt={isDuplicate ? "" : `Shop ${category.label}`}
          fill
          quality={90}
          sizes="208px"
          draggable={false}
          className="origin-top object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          style={{ objectPosition: category.objectPosition || "center top" }}
        />
      </div>
      <div className="bg-brand-primary px-3 py-2 text-center sm:py-2.5">
        <h3 className="text-sm font-bold text-white sm:text-base">{category.label}</h3>
      </div>
    </Link>
  );
}

export default function CategoryGrid({ categories = [] }) {
  const items = toCards(categories);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const hoveringRef = useRef(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const lastXRef = useRef(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      pausedRef.current = true;
      setPaused(true);
    }

    let frame;
    const tick = () => {
      const track = trackRef.current;
      if (
        track &&
        !pausedRef.current &&
        !draggingRef.current &&
        !hoveringRef.current
      ) {
        offsetRef.current -= 0.55;
        const half = track.scrollWidth / 2;
        if (half > 0 && -offsetRef.current >= half) {
          offsetRef.current += half;
        }
        track.style.transform = `translateX(${offsetRef.current}px)`;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const wrapOffset = () => {
    const track = trackRef.current;
    if (!track) return;
    const half = track.scrollWidth / 2;
    if (half <= 0) return;
    while (-offsetRef.current >= half) offsetRef.current += half;
    while (offsetRef.current > 0) offsetRef.current -= half;
    track.style.transform = `translateX(${offsetRef.current}px)`;
  };

  const onPointerDown = (event) => {
    draggingRef.current = true;
    movedRef.current = false;
    lastXRef.current = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!draggingRef.current) return;
    const dx = event.clientX - lastXRef.current;
    if (Math.abs(dx) > 6) movedRef.current = true;
    if (!movedRef.current) return;
    pausedRef.current = true;
    setPaused(true);
    offsetRef.current += dx;
    lastXRef.current = event.clientX;
    wrapOffset();
  };

  const onPointerUp = (event) => {
    draggingRef.current = false;
    if (movedRef.current) return;
    if (!event.target.closest("a")) {
      setPaused((current) => !current);
    }
  };

  const onCardClick = (event) => {
    if (movedRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <section className="overflow-hidden bg-brand-cream py-6 sm:py-8">
      <div className="mb-4 px-5 text-center sm:mb-6 sm:px-6">
        <h2 className="text-xl font-black tracking-tight text-brand-primary sm:text-2xl">
          Shop By Category
        </h2>
        <p
          className="mt-1 cursor-pointer text-xs text-neutral-500"
          onClick={() => setPaused((current) => !current)}
        >
          {paused ? "Paused — click here to play, or drag to slide." : "Click here to pause · drag to slide"}
        </p>
      </div>

      <div
        className={cn(
          "relative cursor-grab select-none active:cursor-grabbing",
          paused && "cursor-grab"
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onMouseEnter={() => {
          hoveringRef.current = true;
        }}
        onMouseLeave={() => {
          hoveringRef.current = false;
          draggingRef.current = false;
        }}
      >
        <div ref={trackRef} className="flex w-max gap-3 pr-3 will-change-transform sm:gap-5 sm:pr-5">
          {items.map((category) => (
            <CategoryCard
              key={category.label}
              category={category}
              onCardClick={onCardClick}
            />
          ))}
          {items.map((category) => (
            <CategoryCard
              key={`loop-${category.label}`}
              category={category}
              isDuplicate
              onCardClick={onCardClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
