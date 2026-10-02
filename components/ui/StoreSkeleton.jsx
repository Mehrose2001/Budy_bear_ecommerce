export default function StoreSkeleton({ variant = "home" }) {
  if (variant === "product") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-4 w-48 animate-pulse rounded bg-brand-cream" />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-3xl bg-brand-cream" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded-xl bg-brand-cream" />
            <div className="h-5 w-1/3 animate-pulse rounded-xl bg-neutral-100" />
            <div className="h-10 w-40 animate-pulse rounded-xl bg-brand-cream" />
            <div className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "listing") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-8 w-64 animate-pulse rounded-xl bg-brand-cream" />
        <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-neutral-100" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="hidden h-[520px] animate-pulse rounded-2xl bg-brand-cream lg:block" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="aspect-[4/5] animate-pulse rounded-2xl bg-brand-cream" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-brand-cream" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse">
      <div className="h-[46vw] min-h-[220px] max-h-[420px] bg-brand-cream" />
      <div className="bg-brand-cream py-6">
        <div className="mx-auto mb-4 h-7 w-52 rounded-lg bg-white/70" />
        <div className="flex gap-3 overflow-hidden px-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-56 w-40 shrink-0 rounded-2xl bg-white sm:h-64 sm:w-52" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-7 w-48 rounded-lg bg-brand-cream" />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-[4/5] rounded-2xl bg-brand-cream" />
          ))}
        </div>
      </div>
    </div>
  );
}
