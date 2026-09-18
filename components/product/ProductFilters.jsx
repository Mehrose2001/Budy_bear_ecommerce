"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { KID_MONTH_SIZES, KID_YEAR_SIZES, PRICE_RANGES } from "@/data/filterOptions";
import { cn } from "@/lib/utils";
import CategoryRangeFilter from "@/components/product/CategoryRangeFilter";
import PriceRangeFilter from "@/components/product/PriceRangeFilter";

function FilterSection({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-200 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-bold uppercase tracking-wide text-neutral-900">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-neutral-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && <div className="mt-4 space-y-2">{children}</div>}
    </div>
  );
}

function CheckboxFilter({
  label,
  count,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-sm transition-colors hover:bg-neutral-50",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      <span className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-brand-primary"
        />
        <span className="text-neutral-700">{label}</span>
      </span>
      {typeof count === "number" && (
        <span className="text-xs text-neutral-400">({count})</span>
      )}
    </label>
  );
}

function SizeButtons({ sizes, filters, facets, onToggleArrayFilter }) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => {
        const count = facets.sizes?.[size] || 0;
        const isActive = filters.sizes.includes(size);
        const isDisabled = !isActive && count === 0;

        return (
          <button
            key={size}
            type="button"
            disabled={isDisabled}
            onClick={() => onToggleArrayFilter("sizes", size)}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
              isActive
                ? "border-brand-primary bg-brand-primary text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-primary hover:text-brand-primary",
              isDisabled && "cursor-not-allowed opacity-40"
            )}
          >
            {size}
            <span className="ml-1 opacity-70">({count})</span>
          </button>
        );
      })}
    </div>
  );
}

export default function ProductFilters({
  filters,
  facets,
  onToggleArrayFilter,
  onToggleBooleanFilter,
  onClearFilters,
  onPriceRangeChange,
  lockedCategory = null,
  priceBounds,
  className,
}) {
  const knownSizes = new Set([...KID_MONTH_SIZES, ...KID_YEAR_SIZES]);
  const extraSizes = Object.keys(facets.sizes || {})
    .filter((size) => !knownSizes.has(size))
    .sort((a, b) => a.localeCompare(b));

  const activeCount =
    filters.categories.length +
    filters.subcategories.length +
    filters.sizes.length +
    filters.priceRanges.length +
    (filters.priceMin != null || filters.priceMax != null ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  return (
    <aside className={cn("rounded-2xl border border-neutral-200 bg-white", className)}>
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900">Filter By</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Refine your search
          </p>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      <div className="px-5 pb-2">
        <FilterSection title="Availability">
          <CheckboxFilter
            label="In stock"
            count={facets.inStock}
            checked={filters.inStock}
            onChange={(checked) => onToggleBooleanFilter("inStock", checked)}
            disabled={facets.inStock === 0 && !filters.inStock}
          />
        </FilterSection>

        <FilterSection title="Category">
          <CategoryRangeFilter
            filters={filters}
            facets={facets}
            lockedCategory={lockedCategory}
            onToggleArrayFilter={onToggleArrayFilter}
          />
        </FilterSection>

        <FilterSection title="Price">
          {priceBounds && (
            <PriceRangeFilter
              minBound={priceBounds.min}
              maxBound={priceBounds.max}
              minValue={filters.priceMin}
              maxValue={filters.priceMax}
              onChange={onPriceRangeChange}
            />
          )}
          <div className="mt-4 space-y-2">
            {PRICE_RANGES.map((range) => (
              <CheckboxFilter
                key={range.id}
                label={range.label}
                count={facets.priceRanges?.[range.id] || 0}
                checked={filters.priceRanges.includes(range.id)}
                onChange={() => onToggleArrayFilter("priceRanges", range.id)}
                disabled={
                  !filters.priceRanges.includes(range.id) &&
                  (facets.priceRanges?.[range.id] || 0) === 0
                }
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Size">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Months
          </p>
          <SizeButtons
            sizes={KID_MONTH_SIZES}
            filters={filters}
            facets={facets}
            onToggleArrayFilter={onToggleArrayFilter}
          />
          <p className="pt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Years
          </p>
          <SizeButtons
            sizes={KID_YEAR_SIZES}
            filters={filters}
            facets={facets}
            onToggleArrayFilter={onToggleArrayFilter}
          />
          {extraSizes.length > 0 && (
            <>
              <p className="pt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Other
              </p>
              <SizeButtons
                sizes={extraSizes}
                filters={filters}
                facets={facets}
                onToggleArrayFilter={onToggleArrayFilter}
              />
            </>
          )}
        </FilterSection>
      </div>
    </aside>
  );
}
