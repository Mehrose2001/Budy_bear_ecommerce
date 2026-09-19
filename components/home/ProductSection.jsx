import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/ui/Button";

export default function ProductSection({
  title,
  description,
  products,
  viewAllHref,
  viewAllLabel = "View All",
}) {
  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-neutral-900">
            {title}
          </h2>
          {description && (
            <p className="mt-2 max-w-2xl text-neutral-600">{description}</p>
          )}
        </div>
        {viewAllHref && (
          <Button href={viewAllHref} variant="outline">
            {viewAllLabel}
          </Button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-5 sm:snap-none">
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[72%] shrink-0 snap-start sm:w-auto"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
