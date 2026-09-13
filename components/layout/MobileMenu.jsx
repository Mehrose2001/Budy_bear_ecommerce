"use client";

import Link from "next/link";
import { ChevronDown, Heart, ShoppingBag, User, X } from "lucide-react";
import { mainNavItems } from "@/data/navigation";
import { cn } from "@/lib/utils";
import BrandLogo from "./BrandLogo";
import SearchBar from "./SearchBar";

export default function MobileMenu({
  isOpen,
  onClose,
  searchQuery,
  onSearchQueryChange,
  onSearch,
}) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
          <BrandLogo size={44} showWordmark onClick={onClose} />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 hover:bg-brand-cream"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-neutral-200 px-4 py-4">
          <SearchBar
            id="mobile-search"
            value={searchQuery}
            onChange={onSearchQueryChange}
            onSubmit={onSearch}
            onNavigate={onClose}
            placeholder="Search products..."
          />
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Mobile navigation">
          <ul className="space-y-1">
            {mainNavItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold tracking-wide text-neutral-800 transition-colors hover:bg-brand-cream",
                    item.label === "SALE" && "text-brand-accent",
                    item.label === "NEW ARRIVALS" && "text-brand-secondary"
                  )}
                >
                  {item.label}
                  {item.megaMenu && (
                    <ChevronDown className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                  )}
                </Link>
                {item.megaMenu && (
                  <ul className="mb-2 ml-4 space-y-1 border-l border-neutral-100 pl-4">
                    {item.megaMenu.map((subItem) => (
                      <li key={subItem.label}>
                        <Link
                          href={subItem.href}
                          onClick={onClose}
                          className="block rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-brand-cream hover:text-brand-primary"
                        >
                          {subItem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid grid-cols-3 gap-2 border-t border-neutral-200 p-4">
          <Link
            href="/login"
            onClick={onClose}
            className="flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium text-neutral-700 hover:bg-brand-cream"
          >
            <User className="h-5 w-5" />
            Account
          </Link>
          <Link
            href="/wishlist"
            onClick={onClose}
            className="flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium text-neutral-700 hover:bg-brand-cream"
          >
            <Heart className="h-5 w-5" />
            Favourites
          </Link>
          <Link
            href="/cart"
            onClick={onClose}
            className="flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium text-neutral-700 hover:bg-brand-cream"
          >
            <ShoppingBag className="h-5 w-5" />
            Cart
          </Link>
        </div>
      </div>
    </>
  );
}
