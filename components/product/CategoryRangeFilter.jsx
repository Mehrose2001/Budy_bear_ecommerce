"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { categories as allCategories } from "@/data/categories";
import { cn, formatLabel } from "@/lib/utils";

function CheckboxRow({ label, count, checked, disabled, onChange }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-sm transition-colors hover:bg-brand-cream/70",
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

function CategoryBranch({
  category,
  filters,
  facets,
  lockedCategory,
  onToggleArrayFilter,
}) {
  const isLocked = lockedCategory === category.slug;
  const hasSelectedChild = category.subcategories.some((subcategory) =>
    filters.subcategories.includes(subcategory)
  );
  const [isOpen, setIsOpen] = useState(isLocked || hasSelectedChild);
  const categoryCount = facets.categories?.[category.slug] || 0;
  const isCategoryChecked = filters.categories.includes(category.slug);

  return (
    <div className="rounded-xl">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-brand-cream"
          aria-expanded={isOpen}
          aria-label={`${isOpen ? "Collapse" : "Expand"} ${category.name}`}
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
          />
        </button>

        {lockedCategory ? (
          <Link
            href={`/category/${category.slug}`}
            className={cn(
              "flex flex-1 items-center justify-between rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors hover:text-brand-primary",
              isLocked ? "text-brand-primary" : "text-neutral-800"
            )}
          >
            <span>{category.name}</span>
            <span className="text-xs font-medium text-neutral-400">
              ({categoryCount})
            </span>
          </Link>
        ) : (
          <div className="flex-1">
            <CheckboxRow
              label={category.name}
              count={categoryCount}
              checked={isCategoryChecked}
              disabled={!isCategoryChecked && categoryCount === 0}
              onChange={() => onToggleArrayFilter("categories", category.slug)}
            />
          </div>
        )}
      </div>

      {isOpen && (
        <ul className="ml-8 mt-1 space-y-0.5 border-l border-neutral-200 pl-3">
          {category.subcategories.map((subcategory) => {
            const count = facets.subcategories?.[subcategory] || 0;
            const checked = filters.subcategories.includes(subcategory);

            return (
              <li key={subcategory}>
                <CheckboxRow
                  label={formatLabel(subcategory)}
                  count={count}
                  checked={checked}
                  disabled={!checked && count === 0}
                  onChange={() =>
                    onToggleArrayFilter("subcategories", subcategory)
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function CategoryRangeFilter({
  filters,
  facets,
  lockedCategory,
  onToggleArrayFilter,
}) {
  const visibleCategories = lockedCategory
    ? allCategories
    : allCategories.filter(
        (category) => (facets.categories?.[category.slug] || 0) > 0
      );

  if (!visibleCategories.length) return null;

  return (
    <div className="space-y-2">
      {visibleCategories.map((category) => (
        <CategoryBranch
          key={category.slug}
          category={category}
          filters={filters}
          facets={facets}
          lockedCategory={lockedCategory}
          onToggleArrayFilter={onToggleArrayFilter}
        />
      ))}
    </div>
  );
}
