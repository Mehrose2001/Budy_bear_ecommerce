import Image from "next/image";
import Link from "next/link";
import { shopCategories } from "@/data/navigation";

export default function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-2xl font-black tracking-tight text-brand-primary sm:text-3xl">
          Shop By Category
        </h2>
        <p className="mt-3 text-neutral-600">
          Explore our curated collections for every age and occasion.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4 lg:gap-6">
        {shopCategories.map((category) => (
          <Link
            key={category.label}
            href={category.href}
            className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-[#eaf0f6]">
              <Image
                src={category.image}
                alt={`Shop ${category.label}`}
                fill
                unoptimized
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="bg-brand-primary px-3 py-2.5 text-center sm:px-4 sm:py-3">
              <h3 className="text-sm font-bold text-white sm:text-lg">
                {category.label}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
