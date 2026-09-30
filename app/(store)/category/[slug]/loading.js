export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-neutral-200" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden h-[600px] animate-pulse rounded-2xl bg-neutral-100 lg:block" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse rounded-2xl bg-neutral-100"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
