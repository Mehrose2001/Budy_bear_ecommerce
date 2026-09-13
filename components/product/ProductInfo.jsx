"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Minus, Plus, Truck, RefreshCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import StarRating from "@/components/ui/StarRating";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useWishlist } from "@/context/WishlistContext";
import { COLOR_SWATCHES, FREE_DELIVERY_THRESHOLD } from "@/data/store";
import { formatLabel, formatPrice, getDiscountPercent, cn } from "@/lib/utils";

export default function ProductInfo({ product, compact = false, onAdded }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { hasItem, toggleItem } = useWishlist();
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const wishlisted = hasItem(product.id);

  const discount = getDiscountPercent(product.price, product.salePrice);
  const displayPrice = product.salePrice ?? product.price;

  const canAdd = product.stock > 0;

  const handleAdd = (buyNow = false) => {
    if (!canAdd) return;
    addItem(product, { size, color, quantity, openDrawer: !buyNow });
    showToast(`${product.name} added to cart`);
    onAdded?.(buyNow);
  };

  const quantityOptions = useMemo(
    () => Math.min(product.stock, 10),
    [product.stock]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {product.newArrival && <Badge variant="new">New</Badge>}
        {discount > 0 && <Badge variant="sale">{discount}% OFF</Badge>}
        {product.bestSeller && <Badge variant="featured">Best Seller</Badge>}
      </div>

      <h1 className={cn("mt-3 font-black tracking-tight text-neutral-900", compact ? "text-2xl" : "text-3xl")}>
        {product.name}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        {product.brand} · {formatLabel(product.category)}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <StarRating rating={product.rating} size="md" count={product.reviewCount} />
        <a href="#reviews" className="text-sm font-medium text-brand-primary hover:underline">
          Read reviews
        </a>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <span className="text-3xl font-black text-neutral-900">
          {formatPrice(displayPrice)}
        </span>
        {product.salePrice && (
          <span className="text-lg text-neutral-400 line-through">
            {formatPrice(product.price)}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-neutral-500">
        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
      </p>

      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-bold text-neutral-900">Color</legend>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setColor(option)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium",
                color === option
                  ? "border-brand-primary bg-brand-cream"
                  : "border-neutral-200 hover:border-brand-primary"
              )}
              aria-pressed={color === option}
            >
              <span
                className="h-4 w-4 rounded-full border border-neutral-200"
                style={{ backgroundColor: COLOR_SWATCHES[option] || "#d4d4d4" }}
              />
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <legend className="text-sm font-bold text-neutral-900">Size</legend>
          <button
            type="button"
            onClick={() => setSizeGuideOpen(true)}
            className="text-sm font-semibold text-brand-primary hover:underline"
          >
            Size guide
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSize(option)}
              className={cn(
                "min-w-12 rounded-xl border px-3 py-2 text-sm font-semibold",
                size === option
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-neutral-200 hover:border-brand-primary"
              )}
              aria-pressed={size === option}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <label className="text-sm font-bold text-neutral-900" htmlFor={`qty-${product.id}`}>
          Quantity
        </label>
        <div className="mt-3 inline-flex items-center rounded-full border border-neutral-200">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            className="inline-flex h-11 w-11 items-center justify-center"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            id={`qty-${product.id}`}
            value={quantity}
            readOnly
            className="w-10 border-0 bg-transparent text-center text-sm font-semibold outline-none"
          />
          <button
            type="button"
            onClick={() =>
              setQuantity((current) => Math.min(quantityOptions, current + 1))
            }
            className="inline-flex h-11 w-11 items-center justify-center"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={cn("mt-6 grid gap-3", compact ? "" : "sm:grid-cols-[1fr_1fr_auto]")}>
        <Button
          onClick={() => handleAdd(false)}
          disabled={!canAdd}
          className="w-full"
        >
          Add to Cart
        </Button>
        <Button
          onClick={() => handleAdd(true)}
          disabled={!canAdd}
          variant="accent"
          className="w-full"
        >
          Buy Now
        </Button>
        <button
          type="button"
          onClick={() => {
            toggleItem(product.id);
            showToast(
              wishlisted
                ? `${product.name} removed from favourites`
                : `${product.name} saved to favourites`
            );
          }}
          className={cn(
            "inline-flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 hover:border-brand-primary hover:text-brand-primary",
            wishlisted && "border-brand-secondary text-brand-secondary"
          )}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
        >
          <Heart className={cn("h-5 w-5", wishlisted && "fill-current")} />
        </button>
      </div>

      {compact && (
        <Link
          href={`/product/${product.slug}`}
          className="mt-4 inline-flex text-sm font-semibold text-brand-primary hover:underline"
        >
          View full product
        </Link>
      )}

      {!compact && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-brand-cream p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-neutral-900">
              <Truck className="h-4 w-4" /> Delivery
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Free delivery on orders above {formatPrice(FREE_DELIVERY_THRESHOLD)}.
              Standard delivery across Pakistan in 3–6 working days.
            </p>
          </div>
          <div className="rounded-2xl bg-brand-cream p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-neutral-900">
              <RefreshCcw className="h-4 w-4" /> Returns
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              7-day easy returns and exchanges on unused items with tags attached.
            </p>
          </div>
        </div>
      )}

      <Modal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        title="Size guide"
        labelledBy="size-guide-title"
        className="max-w-lg"
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="py-2">Size</th>
              <th className="py-2">Age</th>
              <th className="py-2">Height</th>
            </tr>
          </thead>
          <tbody>
            {product.sizes.map((option, index) => (
              <tr key={option} className="border-b border-neutral-100">
                <td className="py-2 font-medium">{option}</td>
                <td className="py-2">{option}</td>
                <td className="py-2">{80 + index * 8}–{88 + index * 8} cm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </div>
  );
}
