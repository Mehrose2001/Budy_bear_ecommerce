import { slugify } from "./utils.js";

export function uniqueSubcategories(values) {
  const seen = new Set();
  const result = [];
  (Array.isArray(values) ? values : []).forEach((item) => {
    const name = String(item ?? "").trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) return;
    seen.add(key);
    result.push(name);
  });
  return result;
}

export function parseSubcategoryValue(value) {
  if (Array.isArray(value)) return uniqueSubcategories(value);
  if (value && typeof value === "object") return [];
  const text = String(value ?? "").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return uniqueSubcategories(parsed);
    } catch {
      // A plain subcategory name is kept when the text is not a JSON array.
    }
  }
  if (text.includes("||")) return uniqueSubcategories(text.split("||"));
  return uniqueSubcategories([text]);
}

export function readProductSubcategories(row) {
  if (!row) return [];
  const fromColumn = row.subcategories == null ? [] : parseSubcategoryValue(row.subcategories);
  if (fromColumn.length) return fromColumn;
  return parseSubcategoryValue(row.subcategory);
}

export function productSubcategories(product) {
  return readProductSubcategories(product);
}

export function primarySubcategory(list) {
  return uniqueSubcategories(list)[0] || "";
}

export function subcategoryListFromInput(input, existing = {}) {
  if (input && Object.prototype.hasOwnProperty.call(input, "subcategories")) {
    return uniqueSubcategories(input.subcategories);
  }
  if (input && input.subcategory !== undefined) return parseSubcategoryValue(input.subcategory);
  return readProductSubcategories(existing);
}

export function subcategoryMatches(product, filterValue) {
  const target = String(filterValue || "").trim();
  if (!target) return false;
  const targetKey = target.toLowerCase();
  const targetSlug = slugify(target);
  return productSubcategories(product).some((name) => {
    return name.toLowerCase() === targetKey || (targetSlug && slugify(name) === targetSlug);
  });
}

export function resolveSubcategoryName(value, categories = []) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const names = (categories || []).flatMap((category) =>
    Array.isArray(category?.subcategories) ? category.subcategories : []
  );
  const match = names.find(
    (name) =>
      name === raw ||
      String(name).toLowerCase() === raw.toLowerCase() ||
      slugify(String(name)) === slugify(raw)
  );
  return match || raw;
}

export function subcategorySearchText(product) {
  return productSubcategories(product).join(" ").toLowerCase();
}

export function sharesSubcategory(left, right) {
  const names = new Set(productSubcategories(left).map((name) => name.toLowerCase()));
  return productSubcategories(right).some((name) => names.has(name.toLowerCase()));
}
