"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { shopCategories } from "@/data/navigation";

function CategoryCard({ category, isDuplicate }) {
  const className =
    "group w-40 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border sm:w-52 sm:rounded-3xl";

  const media = (
    <>
      <div className="relative aspect-[3/4] overflow-hidden bg-[#eaf0f6]">
        <Image
          src={category.image}
          alt={isDuplicate ? "" : `Shop ${category.label}`}
          fill
          quality={90}
          sizes="208px"
          className="origin-top object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          style={{ objectPosition: category.objectPosition || "center top" }}
        />
      </div>
      <div className="bg-brand-primary px-3 py-2 text-center sm:py-2.5">
        <h3 className="text-sm font-bold text-white sm:text-base">{category.label}</h3>
      </div>
    </>
  );

  if (isDuplicate) {
    return (
      <div className={className} aria-hidden="true">
        {media}
      </div>
    );
  }

  return (
    <Link href={category.href} className={className}>
      {media}
    </Link>
  );
}

export default function CategoryGrid() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <section className="overflow-hidden bg-brand-cream py-6 sm:py-8">
      <div className="mb-4 px-5 text-center sm:mb-6 sm:px-6">
        <h2 className="text-xl font-black tracking-tight text-brand-primary sm:text-2xl">
          Shop By Category
        </h2>
      </div>

      <div className="relative">
        <div
          className={`flex w-max gap-3 pr-3 sm:gap-5 sm:pr-5 ${
            animate ? "animate-category-marquee hover:[animation-play-state:paused]" : ""
          }`}
        >
          {shopCategories.map((category) => (
            <CategoryCard key={category.label} category={category} />
          ))}
          {shopCategories.map((category) => (
            <CategoryCard
              key={`loop-${category.label}`}
              category={category}
              isDuplicate
            />
          ))}
        </div>
      </div>
    </section>
  );
}
