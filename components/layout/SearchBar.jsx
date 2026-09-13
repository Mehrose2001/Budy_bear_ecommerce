"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchProducts } from "@/data/products";
import { formatPrice } from "@/lib/utils";

export default function SearchBar({
  id = "product-search",
  value,
  onChange,
  onSubmit,
  onNavigate,
  placeholder = "Search for clothes, toys, shoes...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const suggestions = useMemo(() => {
    const query = value.trim();
    if (query.length < 2) return [];
    return searchProducts(query).slice(0, 6);
  }, [value]);

  useEffect(() => {
    const handleClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={(event) => {
          setIsOpen(false);
          onSubmit(event);
        }}
        role="search"
      >
        <label htmlFor={id} className="sr-only">
          Search products
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            id={id}
            type="search"
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
            className="h-11 w-full rounded-full border border-neutral-200 bg-brand-cream/60 pl-11 pr-4 text-sm text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
      </form>

      {isOpen && suggestions.length > 0 && (
        <div
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-brand-cream"
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
            >
              <span className="relative h-12 w-12 overflow-hidden rounded-xl bg-neutral-100">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-neutral-900">
                  {product.name}
                </span>
                <span className="text-xs text-neutral-500">
                  {formatPrice(product.salePrice ?? product.price)}
                </span>
              </span>
            </Link>
          ))}
          <Link
            href={`/search?q=${encodeURIComponent(value.trim())}`}
            className="block border-t border-neutral-100 px-4 py-3 text-center text-sm font-semibold text-brand-primary hover:bg-brand-cream"
            onClick={() => {
              setIsOpen(false);
              onNavigate?.();
            }}
          >
            View all results
          </Link>
        </div>
      )}
    </div>
  );
}
