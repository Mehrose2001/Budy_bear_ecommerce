"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Eye, Heart } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useQuickView } from "@/context/QuickViewContext";
import { useToast } from "@/context/ToastContext";
import { useWishlist } from "@/context/WishlistContext";
import { getEffectivePrice } from "@/lib/productFilters";
import { formatPrice, getDiscountPercent, cn } from "@/lib/utils";
import { getProductStock } from "@/lib/variantStock";
import ProductRating from "@/components/ui/ProductRating";

function isDesktopListing() {
  return window.matchMedia("(min-width: 1024px)").matches;
}

export default function ProductCard({ product, className, mobileClickActions = true }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const { openQuickView } = useQuickView();
  const { showToast } = useToast();
  const { hasItem, toggleItem } = useWishlist();
  const isWishlisted = hasItem(product.id);

  const displayPrice = getEffectivePrice(product);
  const listPrice = Number(product.price) || displayPrice;
  const discount = getDiscountPercent(listPrice, displayPrice);
  const images = (Array.isArray(product.images) ? product.images : [])
    .map((item) => (typeof item === "string" ? item : item?.url || ""))
    .filter(Boolean);
  const fallbackImage = "/images/products/product-1.svg";
  const primaryImage = images[0] || fallbackImage;
  const secondaryImage = images[1] || primaryImage;
  const hasAltImage = Boolean(images[1] && images[1] !== primaryImage);
  const inStock = getProductStock(product) > 0;
  const productHref = `/product/${product.slug}`;
  const showActions = isHovered || isRevealed;
  const showingAlt = showActions && hasAltImage;

  useEffect(() => {
    if (!isRevealed) return undefined;

    const onPointerDown = (event) => {
      if (!cardRef.current?.contains(event.target)) setIsRevealed(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsRevealed(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isRevealed]);

  const handleImageClick = (event) => {
    if (!mobileClickActions || isDesktopListing()) return;
    event.preventDefault();
    event.stopPropagation();
    setIsRevealed((current) => !current);
  };

  return (
    <article
      ref={cardRef}
      className={cn("group relative flex flex-col", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsRevealed(false);
      }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200/80">
        <a href={productHref} className="block" onClick={handleImageClick}>
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={showingAlt ? secondaryImage : primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </a>

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.newArrival && <Badge variant="new">New</Badge>}
          {discount > 0 && <Badge variant="sale">{discount}% OFF</Badge>}
          {product.featured && !product.newArrival && (
            <Badge variant="featured">Featured</Badge>
          )}
          {!inStock && <Badge variant="sale">Sold out</Badge>}
        </div>

        <button
          type="button"
          onClick={() => {
            toggleItem(product);
            showToast(
              isWishlisted
                ? `${product.name} removed from favourites`
                : `${product.name} saved to favourites`
            );
          }}
          className={cn(
            "absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-sm transition-all hover:scale-105 hover:text-brand-secondary",
            isWishlisted && "text-brand-secondary"
          )}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
        </button>

        <div
          className={cn(
            "absolute inset-x-2 bottom-2 flex flex-col gap-2 transition-all duration-300 sm:inset-x-3 sm:bottom-3",
            showActions
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
          )}
        >
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full rounded-xl bg-white/95 backdrop-blur"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsRevealed(false);
              openQuickView(product);
            }}
          >
            <Eye className="h-4 w-4" />
            Quick View
          </Button>
          <Button
            href={productHref}
            size="sm"
            className="w-full rounded-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <ArrowUpRight className="h-4 w-4" />
            Full View
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <a href={productHref} className="group/link flex flex-1 flex-col">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-neutral-900 transition-colors group-hover/link:text-brand-primary">
            {product.name}
          </h3>
          <div className="mt-2">
            <ProductRating product={product} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-neutral-900">
              {formatPrice(displayPrice)}
            </span>
            {displayPrice < listPrice && (
              <span className="text-sm text-error line-through">
                {formatPrice(listPrice)}
              </span>
            )}
          </div>
        </a>
      </div>
    </article>
  );
}
