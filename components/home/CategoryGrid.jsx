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
      draggable={false}
    >
      <div className="pointer-events-none relative aspect-[3/4] overflow-hidden bg-[#eaf0f6]">
        <Image
          src={category.image}
          alt={isDuplicate ? "" : `Shop ${category.label}`}
          fill
          quality={75}
          sizes="(max-width: 640px) 160px, 208px"
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
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const hoveringRef = useRef(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const axisRef = useRef(null);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const resumeTimerRef = useRef(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const applyOffset = () => {
    const track = trackRef.current;
    if (!track) return;
    const half = track.scrollWidth / 2;
    if (half > 0) {
      while (-offsetRef.current >= half) offsetRef.current += half;
      while (offsetRef.current > 0) offsetRef.current -= half;
    }
    track.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      pausedRef.current = true;
      setPaused(true);
    }

    let frame;
    const tick = () => {
      if (!pausedRef.current && !draggingRef.current && !hoveringRef.current) {
        offsetRef.current -= 0.55;
        applyOffset();
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const clearResume = () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };

    const resumeSoon = () => {
      draggingRef.current = false;
      axisRef.current = null;
      clearResume();
      resumeTimerRef.current = setTimeout(() => {
        pausedRef.current = false;
        setPaused(false);
      }, 350);
    };

    const startDrag = (x, y) => {
      draggingRef.current = true;
      movedRef.current = false;
      axisRef.current = null;
      lastXRef.current = x;
      lastYRef.current = y;
      clearResume();
    };

    const moveDrag = (x, y, event) => {
      if (!draggingRef.current) return;
      const dx = x - lastXRef.current;
      const dy = y - lastYRef.current;
      if (!axisRef.current) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axisRef.current = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (axisRef.current !== "x") return;
      if (event.cancelable) event.preventDefault();
      movedRef.current = true;
      offsetRef.current += dx;
      lastXRef.current = x;
      lastYRef.current = y;
      applyOffset();
    };

    const onTouchStart = (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      startDrag(touch.clientX, touch.clientY);
    };

    const onTouchMove = (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      moveDrag(touch.clientX, touch.clientY, event);
    };

    const onPointerDown = (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      startDrag(event.clientX, event.clientY);
    };

    const onPointerMove = (event) => {
      if (event.pointerType !== "mouse") return;
      moveDrag(event.clientX, event.clientY, event);
    };

    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchmove", onTouchMove, { passive: false });
    viewport.addEventListener("touchend", resumeSoon, { passive: true });
    viewport.addEventListener("touchcancel", resumeSoon, { passive: true });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove, { passive: false });
    viewport.addEventListener("pointerup", resumeSoon);
    viewport.addEventListener("pointercancel", resumeSoon);

    return () => {
      clearResume();
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchmove", onTouchMove);
      viewport.removeEventListener("touchend", resumeSoon);
      viewport.removeEventListener("touchcancel", resumeSoon);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", resumeSoon);
      viewport.removeEventListener("pointercancel", resumeSoon);
    };
  }, []);

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
          {paused
            ? "Paused — tap here to play, or swipe the row."
            : "Swipe to browse · tap here to pause"}
        </p>
      </div>

      <div
        ref={viewportRef}
        className={cn("relative cursor-grab select-none overflow-hidden active:cursor-grabbing")}
        style={{ touchAction: "pan-y" }}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") hoveringRef.current = true;
        }}
        onPointerLeave={() => {
          hoveringRef.current = false;
          draggingRef.current = false;
        }}
      >
        <div
          ref={trackRef}
          className="flex w-max gap-3 px-5 will-change-transform sm:gap-5 sm:px-6"
        >
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
