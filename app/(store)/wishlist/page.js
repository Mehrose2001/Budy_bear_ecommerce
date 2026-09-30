"use client";

import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPrice } from "@/lib/utils";

export default function WishlistPage() {
  const { items, removeItem, count } = useWishlist();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const moveToCart = (product) => {
    addItem(product, { quantity: 1 });
    removeItem(product.id);
    showToast(`${product.name} moved to cart`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Favourites" },
        ]}
      />
      <h1 className="text-3xl font-black tracking-tight text-neutral-900">
        Favourite items
      </h1>
      <p className="mt-2 text-neutral-600">
        {count} saved item{count === 1 ? "" : "s"}
      </p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <h2 className="text-xl font-bold text-neutral-900">
            No favourites yet
          </h2>
          <p className="mt-2 text-neutral-500">
            Tap the heart on any product to save it here.
          </p>
          <Button href="/products" className="mt-6">
            Browse products
          </Button>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
          {items.map((product) => (
            <li
              key={product.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <Link
                href={`/product/${product.slug}`}
                className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-neutral-100"
              >
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${product.slug}`}
                  className="font-semibold text-neutral-900 hover:text-brand-primary"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-sm text-neutral-500">{product.brand}</p>
                <p className="mt-2 font-bold">
                  {formatPrice(product.salePrice ?? product.price)}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => moveToCart(product)}>Move to cart</Button>
                <Button
                  variant="outline"
                  onClick={() => removeItem(product.id)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
