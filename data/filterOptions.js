export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Best Rated" },
];

export const PRICE_RANGES = [
  { id: "under-999", label: "Under Rs. 999", min: 0, max: 999 },
  { id: "under-1500", label: "Under Rs. 1,500", min: 0, max: 1500 },
  { id: "1000-2999", label: "Rs. 1,000 - 2,999", min: 1000, max: 2999 },
  { id: "3000-4999", label: "Rs. 3,000 - 4,999", min: 3000, max: 4999 },
  { id: "5000-9999", label: "Rs. 5,000 - 9,999", min: 5000, max: 9999 },
  { id: "10000-plus", label: "Rs. 10,000 & Above", min: 10000, max: Infinity },
];

export const RATING_OPTIONS = [
  { value: "4", label: "4★ & up" },
  { value: "3", label: "3★ & up" },
  { value: "2", label: "2★ & up" },
];

export const DEFAULT_FILTERS = {
  categories: [],
  subcategories: [],
  brands: [],
  sizes: [],
  colors: [],
  priceRanges: [],
  priceMin: null,
  priceMax: null,
  minRating: null,
  onSale: false,
  inStock: false,
  newArrivals: false,
  bestSellers: false,
};

export const DEFAULT_SORT = "featured";

export const KID_MONTH_SIZES = [
  "0-3M",
  "3-6M",
  "6-9M",
  "6-12M",
  "9-12M",
  "12-18M",
  "18-24M",
];

export const KID_YEAR_SIZES = [
  "2-3Y",
  "4-5Y",
  "6-7Y",
  "8-9Y",
  "10-11Y",
  "12-13Y",
];

export const PRODUCTS_PER_PAGE = 12;
