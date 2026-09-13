"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { PRICE_RANGES, RATING_OPTIONS } from "@/data/filterOptions";
import { cn } from "@/lib/utils";
import CategoryRangeFilter from "@/components/product/CategoryRangeFilter";
import PriceRangeFilter from "@/components/product/PriceRangeFilter";

const COLOR_MAP = {
  Blue: "#3b82f6",
  Red: "#ef4444",
  Green: "#22c55e",
  Pink: "#ec4899",
  Yellow: "#eab308",
  Navy: "#1e3a8a",
  White: "#ffffff",
  Black: "#171717",
  Purple: "#8b5cf6",
  Orange: "#f97316",
};

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

export default function ProductFilters({
  filters,
  facets,
  onToggleArrayFilter,
  onToggleBooleanFilter,
  onSetRatingFilter,
  onClearFilters,
  onPriceRangeChange,
  lockedCategory = null,
  priceBounds,
  className,
}) {
  const activeCount =
    filters.categories.length +
    filters.subcategories.length +
    filters.brands.length +
    filters.sizes.length +
    filters.colors.length +
    filters.priceRanges.length +
    (filters.priceMin != null || filters.priceMax != null ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.newArrivals ? 1 : 0) +
    (filters.bestSellers ? 1 : 0);

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

        {Object.keys(facets.sizes || {}).length > 0 && (
          <FilterSection title="Size">
            <div className="flex flex-wrap gap-2">
              {Object.entries(facets.sizes)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([size, count]) => {
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
          </FilterSection>
        )}

        {Object.keys(facets.colors || {}).length > 0 && (
          <FilterSection title="Color">
            {Object.entries(facets.colors)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([color, count]) => (
                <label
                  key={color}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-sm hover:bg-neutral-50",
                    !filters.colors.includes(color) &&
                      count === 0 &&
                      "cursor-not-allowed opacity-40"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={filters.colors.includes(color)}
                      disabled={!filters.colors.includes(color) && count === 0}
                      onChange={() => onToggleArrayFilter("colors", color)}
                      className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-neutral-200"
                      style={{ backgroundColor: COLOR_MAP[color] || "#d4d4d4" }}
                      aria-hidden="true"
                    />
                    <span className="text-neutral-700">{color}</span>
                  </span>
                  <span className="text-xs text-neutral-400">({count})</span>
                </label>
              ))}
          </FilterSection>
        )}

        {Object.keys(facets.brands || {}).length > 0 && (
          <FilterSection title="Brand">
            {Object.entries(facets.brands)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([brand, count]) => (
                <CheckboxFilter
                  key={brand}
                  label={brand}
                  count={count}
                  checked={filters.brands.includes(brand)}
                  onChange={() => onToggleArrayFilter("brands", brand)}
                  disabled={!filters.brands.includes(brand) && count === 0}
                />
              ))}
          </FilterSection>
        )}

        <FilterSection title="Customer Rating">
          {RATING_OPTIONS.map((option) => (
            <CheckboxFilter
              key={option.value}
              label={option.label}
              count={facets.ratings?.[option.value] || 0}
              checked={filters.minRating === option.value}
              onChange={(checked) =>
                onSetRatingFilter(checked ? option.value : null)
              }
              disabled={
                filters.minRating !== option.value &&
                (facets.ratings?.[option.value] || 0) === 0
              }
            />
          ))}
        </FilterSection>

        <FilterSection title="Offers">
          <CheckboxFilter
            label="On sale"
            count={facets.onSale}
            checked={filters.onSale}
            onChange={(checked) => onToggleBooleanFilter("onSale", checked)}
            disabled={facets.onSale === 0 && !filters.onSale}
          />
          <CheckboxFilter
            label="New arrivals"
            count={facets.newArrivals}
            checked={filters.newArrivals}
            onChange={(checked) =>
              onToggleBooleanFilter("newArrivals", checked)
            }
            disabled={facets.newArrivals === 0 && !filters.newArrivals}
          />
          <CheckboxFilter
            label="Best sellers"
            count={facets.bestSellers}
            checked={filters.bestSellers}
            onChange={(checked) =>
              onToggleBooleanFilter("bestSellers", checked)
            }
            disabled={facets.bestSellers === 0 && !filters.bestSellers}
          />
        </FilterSection>
      </div>
    </aside>
  );
}
