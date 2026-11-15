"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { formatLabel } from "@/lib/utils";
import { uniqueSubcategories } from "@/lib/productSubcategories";

function optionLabel(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text !== text.toLowerCase() && !text.includes("-")) return text;
  return formatLabel(text);
}

export default function SubcategoryMultiSelect({
  options = [],
  value = [],
  onChange,
  note = "",
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = uniqueSubcategories(value);
  const available = uniqueSubcategories(options);

  const visibleOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return available;
    return available.filter((option) => {
      const label = optionLabel(option).toLowerCase();
      return label.includes(query) || option.toLowerCase().includes(query);
    });
  }, [available, search]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = (option) => {
    const exists = selected.some((item) => item.toLowerCase() === option.toLowerCase());
    const next = exists
      ? selected.filter((item) => item.toLowerCase() !== option.toLowerCase())
      : [...selected, option];
    onChange(uniqueSubcategories(next));
  };

  return (
    <div ref={rootRef} className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-neutral-700" htmlFor={`${listId}-search`}>
          Subcategories
        </label>
        {selected.length ? (
          <button
            type="button"
            className="text-xs font-semibold text-brand-primary hover:underline"
            onClick={() => onChange([])}
          >
            Clear selection
          </button>
        ) : null}
      </div>
      <p className="mb-2 text-xs text-neutral-500">
        Choose every subcategory where this product should appear. Selections stay in place while you add more.
      </p>
      {selected.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((item) => (
            <span
              key={item.toLowerCase()}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-primary"
            >
              <span className="truncate">{optionLabel(item)}</span>
              <button
                type="button"
                className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-white"
                aria-label={`Remove ${optionLabel(item)}`}
                onClick={() => toggle(item)}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      {!available.length ? (
        <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">
          This category has no subcategories yet. Add them in Categories, then assign them here.
        </p>
      ) : (
        <>
          <input
            id={`${listId}-search`}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
            placeholder={selected.length ? "Search to add another subcategory" : "Search subcategories"}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
          {open ? (
            <ul
              id={listId}
              role="listbox"
              aria-multiselectable="true"
              className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-sm"
            >
              {visibleOptions.length ? (
                visibleOptions.map((option) => {
                  const checked = selected.some((item) => item.toLowerCase() === option.toLowerCase());
                  return (
                    <li key={option.toLowerCase()} role="option" aria-selected={checked}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-brand-cream"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => toggle(option)}
                      >
                        <input type="checkbox" readOnly checked={checked} className="h-4 w-4 rounded border-neutral-300" tabIndex={-1} />
                        <span>{optionLabel(option)}</span>
                      </button>
                    </li>
                  );
                })
              ) : (
                <li className="px-3 py-2 text-sm text-neutral-500">No matching subcategories.</li>
              )}
            </ul>
          ) : null}
        </>
      )}
      {note ? <p className="mt-2 text-xs text-amber-800">{note}</p> : null}
    </div>
  );
}
