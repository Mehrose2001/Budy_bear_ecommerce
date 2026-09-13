"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StarRating from "@/components/ui/StarRating";
import { useCart } from "@/context/CartContext";
import { useQuickView } from "@/context/QuickViewContext";
import { useToast } from "@/context/ToastContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice, getDiscountPercent, cn } from "@/lib/utils";

export default function ProductCard({ product, className }) {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCart();
  const { openQuickView } = useQuickView();
  const { showToast } = useToast();
  const { hasItem, toggleItem } = useWishlist();
  const isWishlisted = hasItem(product.id);

  const discount = getDiscountPercent(product.price, product.salePrice);
  const displayPrice = product.salePrice ?? product.price;
  const secondaryImage = product.images[1] || product.images[0];

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addItem(product, { quantity: 1 });
    showToast(`${product.name} added to cart`);
  };

  return (
    <article
      className={cn("group relative flex flex-col", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200/80">
        <Link href={`/product/${product.slug}`} className="block">
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={isHovered ? secondaryImage : product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.newArrival && <Badge variant="new">New</Badge>}
          {discount > 0 && <Badge variant="sale">{discount}% OFF</Badge>}
          {product.featured && !product.newArrival && (
            <Badge variant="featured">Featured</Badge>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            toggleItem(product.id);
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

        <div className="absolute inset-x-3 bottom-3 flex translate-y-2 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full rounded-xl bg-white/95 backdrop-blur"
            onClick={() => openQuickView(product)}
          >
            <Eye className="h-4 w-4" />
            Quick View
          </Button>
          <Button
            type="button"
            size="sm"
            className="w-full rounded-xl"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <StarRating rating={product.rating} count={product.reviewCount} />
        <Link href={`/product/${product.slug}`} className="group/link flex-1">
          <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-neutral-900 transition-colors group-hover/link:text-brand-primary">
            {product.name}
          </h3>
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-neutral-900">
            {formatPrice(displayPrice)}
          </span>
          {product.salePrice && (
            <span className="text-sm text-neutral-400 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
