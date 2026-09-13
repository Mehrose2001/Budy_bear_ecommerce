import ProductCard from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";

export default function ProductGrid({ products, className, emptyMessage }) {
  if (!products.length) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center">
        <h3 className="text-lg font-semibold text-neutral-900">
          No products found
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          {emptyMessage ||
            "Try adjusting your filters or browse another category."}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
