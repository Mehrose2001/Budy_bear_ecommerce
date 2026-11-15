"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import ProductFilters from "@/components/product/ProductFilters";
import ProductGrid from "@/components/product/ProductGrid";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  SORT_OPTIONS,
} from "@/data/filterOptions";
import {
  applyFilters,
  buildSearchParamsFromFilters,
  getActiveFilterCount,
  getFilterFacets,
  paginateProducts,
  parseFiltersFromSearchParams,
  sortProducts,
  PRODUCTS_PER_PAGE,
} from "@/lib/productFilters";
import {
  clearListingScrollRestore,
  holdListingScrollRestore,
  persistListingScroll,
  readListingScroll,
  shouldRestoreListingScroll,
} from "@/lib/listingScroll";
import { cn, formatLabel, formatPrice, slugify } from "@/lib/utils";
import { resolveSubcategoryName, uniqueSubcategories } from "@/lib/productSubcategories";
import CategoryHeroBanner from "@/components/category/CategoryHeroBanner";
import { resolveListingBanner } from "@/lib/categoryBanner";

function parseListingPage(searchParams) {
  const raw = Number(searchParams.get("page"));
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

function paginationItems(current, total) {
  const wanted = new Set([1, total]);
  for (let page = current - 1; page <= current + 1; page += 1) {
    if (page >= 1 && page <= total) wanted.add(page);
  }

  const pages = [...wanted].sort((a, b) => a - b);
  const items = [];
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) items.push(`gap-${page}`);
    items.push(page);
  });
  return items;
}

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
  categories = [],
  category = null,
  siteUrl = "",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingTopRef = useRef(null);
  const scrollListingIntoView = useRef(false);
  const listingUrlRef = useRef("");

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = useMemo(() => {
    const parsed = parseFiltersFromSearchParams(searchParams, {
      category: lockedCategory,
      filter: presetFilter,
    });

    if (lockedCategory) {
      parsed.categories = [lockedCategory];
    }

    parsed.subcategories = uniqueSubcategories(
      parsed.subcategories.map((value) => resolveSubcategoryName(value, categories))
    );

    return parsed;
  }, [searchParams, lockedCategory, presetFilter, categories]);

  const sortBy = searchParams.get("sort") || DEFAULT_SORT;
  const requestedPage = parseListingPage(searchParams);

  const listingBanner = useMemo(() => {
    if (!category) return null;
    const fromQuery = slugify(String(searchParams.get("subcategory") || ""));
    const fromFilter = filters.subcategories[0] ? slugify(filters.subcategories[0]) : "";
    return resolveListingBanner(category, fromFilter || fromQuery);
  }, [category, filters.subcategories, searchParams]);

  const filteredProducts = useMemo(() => {
    const sorted = sortProducts(applyFilters(products, filters), sortBy);
    const seen = new Set();
    return sorted.filter((product) => {
      const key = product?.id ?? product?.slug;
      if (key == null || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [products, filters, sortBy]);

  const facets = useMemo(
    () => getFilterFacets(products, filters),
    [products, filters]
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const visibleProducts = paginateProducts(filteredProducts, currentPage, PRODUCTS_PER_PAGE);
  const pageStart = filteredProducts.length ? (currentPage - 1) * PRODUCTS_PER_PAGE + 1 : 0;
  const pageEnd = filteredProducts.length ? pageStart + visibleProducts.length - 1 : 0;
  const activeFilterCount = getActiveFilterCount(filters);

  const priceBounds = useMemo(
    () => ({
      min: PRICE_FILTER_MIN,
      max: PRICE_FILTER_MAX,
    }),
    []
  );

  const buildListingHref = (nextFilters, nextSort = sortBy, nextPage = 1) => {
    const params = buildSearchParamsFromFilters(nextFilters, nextSort);
    if (searchQuery) params.set("q", searchQuery);
    const preset = searchParams.get("filter");
    if (preset) params.set("filter", preset);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  useEffect(() => {
    listingUrlRef.current = `${window.location.pathname}${window.location.search}`;
  });

  useEffect(() => {
    if (!shouldRestoreListingScroll()) return undefined;
    const y = readListingScroll();
    const clearFlag = window.setTimeout(clearListingScrollRestore, 0);
    if (y == null) {
      return () => window.clearTimeout(clearFlag);
    }

    holdListingScrollRestore(900);
    let cancelled = false;
    const apply = () => {
      if (!cancelled) window.scrollTo(0, y);
    };
    apply();
    const frame = window.requestAnimationFrame(apply);
    const timers = [0, 60, 180, 400, 800].map((delay) => window.setTimeout(apply, delay));

    return () => {
      cancelled = true;
      window.clearTimeout(clearFlag);
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [searchParams]);

  useEffect(() => {
    let timer = 0;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const current = `${window.location.pathname}${window.location.search}`;
        if (current !== listingUrlRef.current) return;
        persistListingScroll();
      }, 120);
    };

    const onProductLink = (event) => {
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("/product/")) return;
      persistListingScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onProductLink, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onProductLink, true);
    };
  }, []);

  useEffect(() => {
    if (requestedPage <= totalPages) return;
    router.replace(buildListingHref(filters, sortBy, totalPages), { scroll: false });
  }, [requestedPage, totalPages, filters, sortBy, searchQuery, basePath, router, searchParams]);

  useEffect(() => {
    if (!scrollListingIntoView.current) return;
    scrollListingIntoView.current = false;
    listingTopRef.current?.scrollIntoView({ block: "start" });
  }, [currentPage, searchParams]);

  useEffect(() => {
    document.body.style.overflow = mobileFiltersOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFiltersOpen]);

  const updateUrl = (nextFilters, nextSort = sortBy, nextPage = 1) => {
    persistListingScroll();
    router.push(buildListingHref(nextFilters, nextSort, nextPage), { scroll: false });
  };

  const goToPage = (nextPage) => {
    const page = Math.min(Math.max(1, nextPage), totalPages);
    if (page === currentPage) return;
    scrollListingIntoView.current = true;
    updateUrl(filters, sortBy, page);
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
    activeChips.push({ key: "onSale", label: "Sale" });
  }
  if (filters.inStock) {
    activeChips.push({ key: "inStock", label: "In stock" });
  }
  if (filters.newArrivals) {
    activeChips.push({ key: "newArrivals", label: "New arrivals" });
  }
  if (filters.bestSellers) {
    activeChips.push({ key: "bestSellers", label: "Sale" });
  }

  const activeSubcategory = lockedCategory && filters.subcategories.length === 1 ? filters.subcategories[0] : "";
  const heading = activeSubcategory ? formatLabel(activeSubcategory) : title;
  const crumbItems = useMemo(() => {
    if (!activeSubcategory) return breadcrumbs;
    const items = breadcrumbs.map((item, index) => {
      if (index !== breadcrumbs.length - 1) return item;
      return { ...item, href: item.href || basePath };
    });
    items.push({ label: formatLabel(activeSubcategory) });
    return items;
  }, [activeSubcategory, breadcrumbs, basePath]);

  const filterProps = {
    categories,
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
      {listingBanner ? <CategoryHeroBanner banner={listingBanner} /> : null}
      <Breadcrumbs items={crumbItems} baseUrl={siteUrl} />

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 sm:text-4xl">
            {heading}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-neutral-600">{description}</p>
          )}
          <p className="mt-3 text-sm text-neutral-500">
            {filteredProducts.length
              ? `Showing ${pageStart}–${pageEnd} of ${filteredProducts.length} products`
              : "0 products"}
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
              className="select-field h-11 rounded-full border border-neutral-200 bg-white pl-4 pr-10 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
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

        <div ref={listingTopRef} className="scroll-mt-36">
          <ProductGrid products={visibleProducts} mobileClickActions />
          {totalPages > 1 && (
            <nav
              className="mt-10 flex flex-col items-center gap-3"
              aria-label="Pagination"
            >
              <p className="text-sm font-medium text-neutral-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="inline-flex h-10 items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-800 transition-colors hover:border-brand-primary hover:text-brand-primary disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                {paginationItems(currentPage, totalPages).map((item) =>
                  typeof item === "number" ? (
                    <button
                      key={item}
                      type="button"
                      onClick={() => goToPage(item)}
                      aria-current={item === currentPage ? "page" : undefined}
                      className={cn(
                        "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors",
                        item === currentPage
                          ? "bg-brand-primary text-white"
                          : "border border-neutral-200 bg-white text-neutral-800 hover:border-brand-primary hover:text-brand-primary"
                      )}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={item} className="px-1 text-sm text-neutral-400" aria-hidden="true">
                      …
                    </span>
                  )
                )}
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-10 items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-800 transition-colors hover:border-brand-primary hover:text-brand-primary disabled:pointer-events-none disabled:opacity-40"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </nav>
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
