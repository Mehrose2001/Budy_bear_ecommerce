import Link from "next/link";
import Button from "@/components/ui/Button";

const schoolItems = [
  {
    title: "Backpacks",
    href: "/category/school?subcategory=backpacks",
    emoji: "🎒",
  },
  {
    title: "Lunch Boxes",
    href: "/category/school?subcategory=lunch-boxes",
    emoji: "🍱",
  },
  {
    title: "Stationery",
    href: "/category/school?subcategory=stationery",
    emoji: "✏️",
  },
  {
    title: "Water Bottles",
    href: "/category/school?subcategory=water-bottles",
    emoji: "💧",
  },
];

export default function SchoolSection() {
  return (
    <section className="bg-gradient-to-br from-brand-cream via-white to-brand-primary/5 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="rounded-full bg-brand-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-primary">
                Back to School
              </span>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-neutral-900 sm:text-4xl">
                Ready. Set. Learn.
              </h2>
              <p className="mt-4 max-w-xl text-neutral-600">
                Everything your child needs for a confident start to the new
                school year — from backpacks to stationery, lunch boxes, and
                more.
              </p>
              <Button href="/category/school" className="mt-8" size="lg">
                Explore Collection
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {schoolItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 transition-all hover:-translate-y-1 hover:border-brand-primary hover:shadow-md"
                >
                  <span className="text-3xl" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-neutral-900">
                    {item.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
