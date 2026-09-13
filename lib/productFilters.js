import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  PRICE_RANGES,
  PRODUCTS_PER_PAGE,
  RATING_OPTIONS,
} from "@/data/filterOptions";
import { getDiscountPercent } from "@/lib/utils";

export function getEffectivePrice(product) {
  return product.salePrice ?? product.price;
}

export function isOnSale(product) {
  return Boolean(product.salePrice && product.salePrice < product.price);
}

function matchesPriceRange(product, rangeId) {
  const range = PRICE_RANGES.find((item) => item.id === rangeId);
  if (!range) return true;

  const price = getEffectivePrice(product);
  return price >= range.min && price <= range.max;
}

function matchesRating(product, minRating) {
  if (!minRating) return true;
  return product.rating >= Number(minRating);
}

export function applyFilters(products, filters = DEFAULT_FILTERS) {
  return products.filter((product) => {
    if (filters.categories.length && !filters.categories.includes(product.category)) {
      return false;
    }

    if (
      filters.subcategories.length &&
      !filters.subcategories.includes(product.subcategory)
    ) {
      return false;
    }

    if (filters.brands.length && !filters.brands.includes(product.brand)) {
      return false;
    }

    if (
      filters.sizes.length &&
      !filters.sizes.some((size) => product.sizes.includes(size))
    ) {
      return false;
    }

    if (
      filters.colors.length &&
      !filters.colors.some((color) => product.colors.includes(color))
    ) {
      return false;
    }

    if (
      filters.priceRanges.length &&
      !filters.priceRanges.some((rangeId) => matchesPriceRange(product, rangeId))
    ) {
      return false;
    }

    const price = getEffectivePrice(product);
    if (filters.priceMin != null && price < Number(filters.priceMin)) {
      return false;
    }
    if (filters.priceMax != null && price > Number(filters.priceMax)) {
      return false;
    }

    if (!matchesRating(product, filters.minRating)) {
      return false;
    }

    if (filters.onSale && !isOnSale(product)) {
      return false;
    }

    if (filters.inStock && product.stock <= 0) {
      return false;
    }

    if (filters.newArrivals && !product.newArrival) {
      return false;
    }

    if (filters.bestSellers && !product.bestSeller) {
      return false;
    }

    return true;
  });
}

export function sortProducts(products, sortBy = DEFAULT_SORT) {
  const sorted = [...products];

  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => b.id - a.id);
    case "price-asc":
      return sorted.sort(
        (a, b) => getEffectivePrice(a) - getEffectivePrice(b)
      );
    case "price-desc":
      return sorted.sort(
        (a, b) => getEffectivePrice(b) - getEffectivePrice(a)
      );
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case "featured":
    default:
      return sorted.sort((a, b) => {
        const scoreA =
          (a.featured ? 4 : 0) +
          (a.bestSeller ? 2 : 0) +
          (a.newArrival ? 1 : 0);
        const scoreB =
          (b.featured ? 4 : 0) +
          (b.bestSeller ? 2 : 0) +
          (b.newArrival ? 1 : 0);

        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.rating - a.rating;
      });
  }
}

export function getUniqueValues(products, key) {
  const values = new Set();

  products.forEach((product) => {
    const value = product[key];
    if (Array.isArray(value)) {
      value.forEach((item) => values.add(item));
    } else if (value) {
      values.add(value);
    }
  });

  return Array.from(values).sort();
}

export function getFilterFacets(products, filters) {
  const buildFacets = (key, sourceProducts) => {
    const counts = {};

    sourceProducts.forEach((product) => {
      const values = Array.isArray(product[key]) ? product[key] : [product[key]];
      values.forEach((value) => {
        if (!value) return;
        counts[value] = (counts[value] || 0) + 1;
      });
    });

    return counts;
  };

  const filtersWithout = (key) => {
    const nextFilters = { ...filters };

    if (key === "categories") nextFilters.categories = [];
    if (key === "subcategories") nextFilters.subcategories = [];
    if (key === "brands") nextFilters.brands = [];
    if (key === "sizes") nextFilters.sizes = [];
    if (key === "colors") nextFilters.colors = [];
    if (key === "priceRanges") nextFilters.priceRanges = [];
    if (key === "priceMin") nextFilters.priceMin = null;
    if (key === "priceMax") nextFilters.priceMax = null;
    if (key === "minRating") nextFilters.minRating = null;
    if (key === "onSale") nextFilters.onSale = false;
    if (key === "inStock") nextFilters.inStock = false;
    if (key === "newArrivals") nextFilters.newArrivals = false;
    if (key === "bestSellers") nextFilters.bestSellers = false;

    return nextFilters;
  };

  const facetKeys = [
    "categories",
    "subcategories",
    "brands",
    "sizes",
    "colors",
  ];

  const facets = {};

  const facetKeyMap = {
    categories: "category",
    subcategories: "subcategory",
    brands: "brand",
    sizes: "sizes",
    colors: "colors",
  };

  facetKeys.forEach((key) => {
    const scopedProducts = applyFilters(products, filtersWithout(key));
    facets[key] = buildFacets(facetKeyMap[key], scopedProducts);
  });

  const priceScoped = applyFilters(products, filtersWithout("priceRanges"));
  facets.priceRanges = PRICE_RANGES.reduce((acc, range) => {
    acc[range.id] = priceScoped.filter((product) =>
      matchesPriceRange(product, range.id)
    ).length;
    return acc;
  }, {});

  const saleScoped = applyFilters(products, filtersWithout("onSale"));
  facets.onSale = saleScoped.filter(isOnSale).length;

  const stockScoped = applyFilters(products, filtersWithout("inStock"));
  facets.inStock = stockScoped.filter((product) => product.stock > 0).length;

  const newScoped = applyFilters(products, filtersWithout("newArrivals"));
  facets.newArrivals = newScoped.filter((product) => product.newArrival).length;

  const bestScoped = applyFilters(products, filtersWithout("bestSellers"));
  facets.bestSellers = bestScoped.filter((product) => product.bestSeller).length;

  facets.ratings = RATING_OPTIONS.reduce((acc, option) => {
    acc[option.value] = applyFilters(products, {
      ...filtersWithout("minRating"),
      minRating: option.value,
    }).length;
    return acc;
  }, {});

  return facets;
}

export function parseFiltersFromSearchParams(searchParams, defaults = {}) {
  const getAll = (key) => {
    const value = searchParams.getAll(key);
    return value.flatMap((item) => item.split(",")).filter(Boolean);
  };

  return {
    categories: defaults.category
      ? [defaults.category]
      : getAll("category"),
    subcategories: getAll("subcategory"),
    brands: getAll("brand"),
    sizes: getAll("size"),
    colors: getAll("color"),
    priceRanges: getAll("price"),
    priceMin: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : null,
    priceMax: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : null,
    minRating: searchParams.get("rating") || null,
    onSale:
      searchParams.get("sale") === "true" ||
      defaults.filter === "sale",
    inStock: searchParams.get("inStock") === "true",
    newArrivals:
      searchParams.get("new") === "true" ||
      defaults.filter === "new-arrivals",
    bestSellers: searchParams.get("bestSeller") === "true",
  };
}

export function buildSearchParamsFromFilters(filters, sortBy) {
  const params = new URLSearchParams();

  filters.categories.forEach((value) => params.append("category", value));
  filters.subcategories.forEach((value) => params.append("subcategory", value));
  filters.brands.forEach((value) => params.append("brand", value));
  filters.sizes.forEach((value) => params.append("size", value));
  filters.colors.forEach((value) => params.append("color", value));
  filters.priceRanges.forEach((value) => params.append("price", value));
  if (filters.priceMin != null) params.set("minPrice", String(filters.priceMin));
  if (filters.priceMax != null) params.set("maxPrice", String(filters.priceMax));

  if (filters.minRating) params.set("rating", filters.minRating);
  if (filters.onSale) params.set("sale", "true");
  if (filters.inStock) params.set("inStock", "true");
  if (filters.newArrivals) params.set("new", "true");
  if (filters.bestSellers) params.set("bestSeller", "true");
  if (sortBy && sortBy !== DEFAULT_SORT) params.set("sort", sortBy);

  return params;
}

export function getActiveFilterCount(filters) {
  let count = 0;
  count += filters.categories.length;
  count += filters.subcategories.length;
  count += filters.brands.length;
  count += filters.sizes.length;
  count += filters.colors.length;
  count += filters.priceRanges.length;
  if (filters.priceMin != null || filters.priceMax != null) count += 1;
  if (filters.minRating) count += 1;
  if (filters.onSale) count += 1;
  if (filters.inStock) count += 1;
  if (filters.newArrivals) count += 1;
  if (filters.bestSellers) count += 1;
  return count;
}

export function paginateProducts(products, page = 1, perPage = PRODUCTS_PER_PAGE) {
  const start = (page - 1) * perPage;
  return products.slice(start, start + perPage);
}

export function getDiscountLabel(product) {
  const discount = getDiscountPercent(product.price, product.salePrice);
  return discount > 0 ? `${discount}% OFF` : null;
}

export { PRODUCTS_PER_PAGE };
