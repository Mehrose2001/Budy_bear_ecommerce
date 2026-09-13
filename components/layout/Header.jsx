"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { announcement } from "@/data/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import BrandLogo from "./BrandLogo";
import Navbar from "./Navbar";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const { itemCount, openDrawer } = useCart();
  const { count: wishlistCount } = useWishlist();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-brand-primary text-brand-cream">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4 text-center text-xs font-medium sm:text-sm">
          {announcement}
        </div>
      </div>

      <div
        className={cn(
          "border-b border-border bg-white/95 backdrop-blur transition-shadow duration-300",
          isScrolled && "shadow-sm"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-[88px]">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-cream"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <BrandLogo size={64} showWordmark priority />

            <div className="hidden flex-1 max-w-xl lg:block">
              <SearchBar
                id="desktop-search"
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
              />
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/search"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-cream lg:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Link>

              <Link
                href="/login"
                className="hidden h-10 w-10 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-cream sm:inline-flex"
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </Link>

              <Link
                href="/wishlist"
                className="relative hidden h-10 w-10 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-cream sm:inline-flex"
                aria-label={`Favourites, ${wishlistCount} items`}
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={openDrawer}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-cream"
                aria-label={`Shopping cart, ${itemCount} items`}
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="hidden border-t border-border lg:block">
            <Navbar />
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
      />
    </header>
  );
}
