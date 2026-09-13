"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import ProductFilters from "@/components/product/ProductFilters";
import ProductGrid from "@/components/product/ProductGrid";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  SORT_OPTIONS,
} from "@/data/filterOptions";
import {
  applyFilters,
  buildSearchParamsFromFilters,
  getActiveFilterCount,
  getEffectivePrice,
  getFilterFacets,
  parseFiltersFromSearchParams,
  sortProducts,
  PRODUCTS_PER_PAGE,
} from "@/lib/productFilters";
import { formatLabel, formatPrice } from "@/lib/utils";

function ActiveFilterChip({ label, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-brand-primary hover:text-brand-primary"
    >
      {label}
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

export default function ProductListing({
  products,
  title,
  description,
  breadcrumbs = [],
  basePath,
  lockedCategory = null,
  presetFilter = null,
  searchQuery = "",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  const filters = useMemo(() => {
    const parsed = parseFiltersFromSearchParams(searchParams, {
      category: lockedCategory,
      filter: presetFilter,
    });

    if (lockedCategory) {
      parsed.categories = [lockedCategory];
    }

    return parsed;
  }, [searchParams, lockedCategory, presetFilter]);

  const sortBy = searchParams.get("sort") || DEFAULT_SORT;

  const filteredProducts = useMemo(
    () => sortProducts(applyFilters(products, filters), sortBy),
    [products, filters, sortBy]
  );

  const facets = useMemo(
    () => getFilterFacets(products, filters),
    [products, filters]
  );

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;
  const activeFilterCount = getActiveFilterCount(filters);

  const priceBounds = useMemo(() => {
    if (!products.length) {
      return { min: 0, max: 10000 };
    }

    const prices = products.map((product) => getEffectivePrice(product));
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [products]);

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [searchParams]);

  useEffect(() => {
    document.body.style.overflow = mobileFiltersOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFiltersOpen]);

  const updateUrl = (nextFilters, nextSort = sortBy) => {
    const params = buildSearchParamsFromFilters(nextFilters, nextSort);
    if (searchQuery) {
      params.set("q", searchQuery);
    }
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
  };

  const toggleArrayFilter = (key, value) => {
    const current = filters[key];
    const nextValues = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    updateUrl({ ...filters, [key]: nextValues });
  };

  const toggleBooleanFilter = (key, checked) => {
    updateUrl({ ...filters, [key]: checked });
  };

  const setRatingFilter = (value) => {
    updateUrl({ ...filters, minRating: value });
  };

  const setPriceRange = ({ priceMin, priceMax }) => {
    updateUrl({ ...filters, priceMin, priceMax });
  };

  const clearFilters = () => {
    const cleared = {
      ...DEFAULT_FILTERS,
      categories: lockedCategory ? [lockedCategory] : [],
    };
    updateUrl(cleared, DEFAULT_SORT);
  };

  const removeFilter = (key, value = null) => {
    if (key === "minRating") {
      updateUrl({ ...filters, minRating: null });
      return;
    }

    if (key === "priceMin" || key === "priceMax") {
      updateUrl({ ...filters, priceMin: null, priceMax: null });
      return;
    }

    if (value === null) {
      updateUrl({ ...filters, [key]: false });
      return;
    }

    updateUrl({
      ...filters,
      [key]: filters[key].filter((item) => item !== value),
    });
  };

  const activeChips = [];

  filters.subcategories.forEach((value) =>
    activeChips.push({
      key: "subcategories",
      value,
      label: formatLabel(value),
    })
  );
  filters.brands.forEach((value) =>
    activeChips.push({ key: "brands", value, label: value })
  );
  filters.sizes.forEach((value) =>
    activeChips.push({ key: "sizes", value, label: `Size: ${value}` })
  );
  filters.colors.forEach((value) =>
    activeChips.push({ key: "colors", value, label: `Color: ${value}` })
  );
  filters.priceRanges.forEach((value) =>
    activeChips.push({ key: "priceRanges", value, label: formatLabel(value) })
  );
  if (filters.priceMin != null || filters.priceMax != null) {
    activeChips.push({
      key: "priceMin",
      label: `${formatPrice(filters.priceMin ?? priceBounds.min)} - ${formatPrice(filters.priceMax ?? priceBounds.max)}`,
    });
  }
  if (filters.minRating) {
    activeChips.push({
      key: "minRating",
      value: filters.minRating,
      label: `${filters.minRating}★ & up`,
    });
  }
  if (filters.onSale) {
    activeChips.push({ key: "onSale", label: "On sale" });
  }
  if (filters.inStock) {
    activeChips.push({ key: "inStock", label: "In stock" });
  }
  if (filters.newArrivals) {
    activeChips.push({ key: "newArrivals", label: "New arrivals" });
  }
  if (filters.bestSellers) {
    activeChips.push({ key: "bestSellers", label: "Best sellers" });
  }

  const filterProps = {
    filters,
    facets,
    onToggleArrayFilter: toggleArrayFilter,
    onToggleBooleanFilter: toggleBooleanFilter,
    onSetRatingFilter: setRatingFilter,
    onClearFilters: clearFilters,
    onPriceRangeChange: setPriceRange,
    lockedCategory,
    priceBounds,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-neutral-600">{description}</p>
          )}
          <p className="mt-3 text-sm text-neutral-500">
            {filteredProducts.length} product
            {filteredProducts.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            Sort by
            <select
              value={sortBy}
              onChange={(event) => updateUrl(filters, event.target.value)}
              className="h-11 rounded-full border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <ActiveFilterChip
              key={`${chip.key}-${chip.value || chip.label}`}
              label={chip.label}
              onRemove={() =>
                chip.value !== undefined
                  ? removeFilter(chip.key, chip.value)
                  : removeFilter(chip.key)
              }
            />
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-brand-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <div className="sticky top-36">
            <ProductFilters {...filterProps} />
          </div>
        </div>

        <div>
          <ProductGrid products={visibleProducts} />
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <Button
                onClick={() =>
                  setVisibleCount((current) => current + PRODUCTS_PER_PAGE)
                }
                variant="outline"
                size="lg"
              >
                Load More Products
              </Button>
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl lg:hidden">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Filters</h2>
                <p className="text-sm text-neutral-500">
                  {filteredProducts.length} products
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ProductFilters {...filterProps} className="border-0 rounded-none" />
            </div>
            <div className="border-t border-neutral-200 p-4">
              <Button
                className="w-full"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show {filteredProducts.length} Products
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
