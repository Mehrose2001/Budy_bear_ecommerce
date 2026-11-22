"use client";

export default function ProductError({ error, reset }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-black text-neutral-900">This product page failed to load</h1>
      <p className="mt-4 text-sm text-neutral-600">{error?.message || "Please try again."}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
