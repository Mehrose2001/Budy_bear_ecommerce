export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-[4/5] animate-pulse rounded-3xl bg-neutral-100" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded-xl bg-neutral-200" />
          <div className="h-5 w-1/3 animate-pulse rounded-xl bg-neutral-100" />
          <div className="h-10 w-40 animate-pulse rounded-xl bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}
