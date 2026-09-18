"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import AnnouncementBar from "./AnnouncementBar";
import BrandLogo from "./BrandLogo";
import Navbar from "./Navbar";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
    if (!query) return;
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-50">
      <AnnouncementBar />

      <div
        className={cn(
          "border-b border-border bg-white/95 backdrop-blur transition-shadow duration-300",
          isScrolled && "shadow-sm"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-cream"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="absolute left-1/2 -translate-x-1/2">
              <BrandLogo size={48} priority />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMobileSearchOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-cream"
                aria-label={mobileSearchOpen ? "Close search" : "Search"}
                aria-expanded={mobileSearchOpen}
              >
                {mobileSearchOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>
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

          <div className="hidden h-[88px] items-center justify-between gap-4 lg:flex">
            <BrandLogo size={64} showWordmark priority />

            <div className="hidden flex-1 max-w-xl lg:block">
              <SearchBar
                id="desktop-search"
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
              />
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-cream"
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </Link>

              <Link
                href="/wishlist"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-cream"
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

          {mobileSearchOpen && (
            <div className="pb-3 lg:hidden">
              <SearchBar
                id="mobile-header-search"
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
                onNavigate={() => setMobileSearchOpen(false)}
                placeholder="Search for clothes, dresses, jackets..."
              />
            </div>
          )}

          <div className="hidden border-t border-border lg:block">
            <Navbar />
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </header>
  );
}
