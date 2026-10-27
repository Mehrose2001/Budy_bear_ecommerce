"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { mainNavItems } from "@/data/navigation";
import AnnouncementBar from "./AnnouncementBar";
import BrandLogo from "./BrandLogo";
import Navbar from "./Navbar";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";

export default function Header({ navItems = mainNavItems, announcement = "" }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const { itemCount, openDrawer } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();

  useEffect(() => {
    let frame = 0;
    const sync = () => {
      frame = 0;
      const y = window.scrollY;
      setIsScrolled((current) => {
        if (y > 64) return true;
        if (y < 2) return false;
        return current;
      });
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
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
    <header className="sticky top-0 z-50 [overflow-anchor:none]">
      <AnnouncementBar announcement={announcement} />

      <div
        className={cn(
          "border-b border-border transition-[background-color,box-shadow] duration-300",
          isScrolled
            ? "bg-white/60 shadow-md backdrop-blur-xl"
            : "bg-white/95 backdrop-blur-sm"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "relative flex items-center justify-between xl:hidden",
              isScrolled ? "h-12" : "h-16"
            )}
          >
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-cream"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center">
              <div className="pointer-events-auto">
                <BrandLogo size={isScrolled ? 36 : 48} priority />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
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

          <div
            className={cn(
              "hidden items-center justify-between gap-4 xl:flex",
              isScrolled ? "h-[68px]" : "h-[88px]"
            )}
          >
            <BrandLogo size={isScrolled ? 48 : 64} showWordmark priority />

            <div className="hidden flex-1 max-w-xl xl:block">
              <SearchBar
                id="desktop-search"
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
              />
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={isAuthenticated ? "/account" : "/login"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-cream"
                aria-label={isAuthenticated ? "My account" : "Sign in"}
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
            <div className="pb-3 xl:hidden">
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

          <div className="hidden border-t border-border xl:block">
            <Navbar items={navItems} compact={isScrolled} />
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        items={navItems}
      />
    </header>
  );
}
