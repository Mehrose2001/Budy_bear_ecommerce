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
  const pausedRef = useRef(false);
  const hoveringRef = useRef(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const lastXRef = useRef(0);
  const resumeTimerRef = useRef(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const wrapScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const half = viewport.scrollWidth / 2;
    if (half <= 0) return;
    if (viewport.scrollLeft >= half) {
      viewport.scrollLeft -= half;
    } else if (viewport.scrollLeft < 0) {
      viewport.scrollLeft += half;
    }
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      pausedRef.current = true;
      setPaused(true);
    }

    let frame;
    const tick = () => {
      const viewport = viewportRef.current;
      if (
        viewport &&
        !pausedRef.current &&
        !draggingRef.current &&
        !hoveringRef.current
      ) {
        viewport.scrollLeft += 0.55;
        wrapScroll();
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

    const pauseForUser = () => {
      draggingRef.current = true;
      clearResume();
    };

    const resumeSoon = () => {
      clearResume();
      resumeTimerRef.current = setTimeout(() => {
        draggingRef.current = false;
        movedRef.current = false;
        pausedRef.current = false;
        setPaused(false);
      }, 400);
    };

    const onTouchStart = () => {
      pauseForUser();
      movedRef.current = false;
    };

    const onTouchMove = () => {
      movedRef.current = true;
    };

    const onMouseDown = (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      pauseForUser();
      movedRef.current = false;
      lastXRef.current = event.clientX;
      viewport.setPointerCapture?.(event.pointerId);
    };

    const onMouseMove = (event) => {
      if (!draggingRef.current || event.pointerType !== "mouse") return;
      const dx = event.clientX - lastXRef.current;
      if (Math.abs(dx) > 3) movedRef.current = true;
      if (!movedRef.current) return;
      if (event.cancelable) event.preventDefault();
      viewport.scrollLeft -= dx;
      lastXRef.current = event.clientX;
      wrapScroll();
    };

    const onMouseUp = (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      try {
        viewport.releasePointerCapture?.(event.pointerId);
      } catch {
        // Capture may already be released.
      }
      resumeSoon();
    };

    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchmove", onTouchMove, { passive: true });
    viewport.addEventListener("touchend", resumeSoon, { passive: true });
    viewport.addEventListener("touchcancel", resumeSoon, { passive: true });
    viewport.addEventListener("scroll", wrapScroll, { passive: true });
    viewport.addEventListener("pointerdown", onMouseDown);
    viewport.addEventListener("pointermove", onMouseMove, { passive: false });
    viewport.addEventListener("pointerup", onMouseUp);
    viewport.addEventListener("pointercancel", onMouseUp);

    return () => {
      clearResume();
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchmove", onTouchMove);
      viewport.removeEventListener("touchend", resumeSoon);
      viewport.removeEventListener("touchcancel", resumeSoon);
      viewport.removeEventListener("scroll", wrapScroll);
      viewport.removeEventListener("pointerdown", onMouseDown);
      viewport.removeEventListener("pointermove", onMouseMove);
      viewport.removeEventListener("pointerup", onMouseUp);
      viewport.removeEventListener("pointercancel", onMouseUp);
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
        className={cn(
          "scrollbar-hide relative w-full cursor-grab overflow-x-auto overflow-y-hidden overscroll-x-contain",
          "touch-pan-x select-none active:cursor-grabbing"
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") hoveringRef.current = true;
        }}
        onPointerLeave={() => {
          hoveringRef.current = false;
        }}
      >
        <div className="flex w-max gap-3 px-5 sm:gap-5 sm:px-6">
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
