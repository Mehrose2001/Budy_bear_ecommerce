"use client";

import Image from "next/image";
import Link from "next/link";
import { shopCategories } from "@/data/navigation";
import useInfiniteMarquee from "@/hooks/useInfiniteMarquee";
import { cn } from "@/lib/utils";

function toCards(categories) {
  if (Array.isArray(categories)) {
    return categories
      .filter((category) => category?.isActive !== false)
      .map((category) => ({
        label: category.name || category.label,
        href: category.href || `/category/${category.slug}`,
        image: category.image || category.imageUrl || "/images/categories/gifts.jpg",
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

function CircleCard({ category, isDuplicate, onCardClick }) {
  return (
    <Link
      href={category.href}
      className="flex w-[4.75rem] shrink-0 flex-col items-center gap-1.5 md:w-28"
      tabIndex={isDuplicate ? -1 : undefined}
      aria-hidden={isDuplicate ? true : undefined}
      onClick={onCardClick}
      draggable={false}
    >
      <span className="relative h-14 w-14 overflow-hidden rounded-full bg-[#eaf0f6] ring-2 ring-white md:h-24 md:w-24">
        <Image
          src={category.image}
          alt={isDuplicate ? "" : category.label}
          fill
          sizes="(min-width: 768px) 96px, 56px"
          draggable={false}
          className="object-cover"
          style={{ objectPosition: category.objectPosition || "center top" }}
        />
      </span>
      <span className="line-clamp-2 text-center text-[10px] font-semibold leading-tight text-brand-primary md:text-sm">
        {isDuplicate ? "\u00a0" : category.label}
      </span>
    </Link>
  );
}

function marqueeCopies(items, copies) {
  return Array.from({ length: copies }, (_, copy) =>
    items.map((category) => ({ ...category, loopKey: `${copy}-${category.label}` }))
  ).flat();
}

export function CategoryCircles({ categories = [] }) {
  const items = toCards(categories);
  const {
    viewportRef,
    trackRef,
    onCardClick,
    onPointerEnter,
    onPointerLeave,
  } = useInfiniteMarquee({ speed: 0.7 });

  if (!items.length) return null;

  const trackItems = marqueeCopies(items, 4);
  const loopItems = marqueeCopies(items, 4).map((category) => ({
    ...category,
    loopKey: `loop-${category.loopKey}`,
  }));

  return (
    <section className="w-full overflow-hidden border-b border-border bg-brand-cream py-4 md:hidden">
      <div
        ref={viewportRef}
        className="relative w-full cursor-grab select-none overflow-hidden active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <div
          ref={trackRef}
          className="flex w-max gap-4 px-4 will-change-transform md:gap-8 md:px-6"
        >
          {trackItems.map((category) => (
            <CircleCard
              key={category.loopKey}
              category={category}
              onCardClick={onCardClick}
            />
          ))}
          {loopItems.map((category) => (
            <CircleCard
              key={category.loopKey}
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

export default function CategoryGrid({ categories = [] }) {
  const items = toCards(categories);
  const {
    viewportRef,
    trackRef,
    paused,
    setPaused,
    onCardClick,
    onPointerEnter,
    onPointerLeave,
  } = useInfiniteMarquee({ speed: 0.55 });

  return (
    <section className="hidden w-full overflow-hidden bg-brand-cream py-6 sm:py-8 md:block">
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
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
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
