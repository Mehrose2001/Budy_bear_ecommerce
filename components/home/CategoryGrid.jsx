import Image from "next/image";
import Link from "next/link";
import { shopCategories } from "@/data/navigation";

export default function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black tracking-tight text-neutral-900">
          Shop By Category
        </h2>
        <p className="mt-3 text-neutral-600">
          Explore our curated collections for every age and occasion.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4 lg:gap-6">
        {shopCategories.map((category) => (
          <Link
            key={category.label}
            href={category.href}
            className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={`/images/categories/${category.label.toLowerCase()}.svg`}
                alt={`Shop ${category.label}`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="text-lg font-bold text-white sm:text-xl">
                  {category.label}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
