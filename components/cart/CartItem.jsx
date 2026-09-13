"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

export default function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart();

  const handleRemove = () => {
    const confirmed = window.confirm(`Remove ${item.name} from your cart?`);
    if (confirmed) {
      removeItem(item.id);
    }
  };

  return (
    <article className="flex gap-4 border-b border-neutral-200 py-5 last:border-b-0">
      <Link
        href={`/product/${item.slug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-neutral-100"
      >
        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/product/${item.slug}`}
              className="font-semibold text-neutral-900 hover:text-brand-primary"
            >
              {item.name}
            </Link>
            <p className="mt-1 text-sm text-neutral-500">
              {item.color} · {item.size}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-full p-2 text-neutral-400 hover:bg-brand-cream hover:text-error"
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-neutral-200">
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="inline-flex h-9 w-9 items-center justify-center"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="inline-flex h-9 w-9 items-center justify-center"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-sm font-bold text-neutral-900">
            {formatPrice(item.unitPrice * item.quantity)}
          </p>
        </div>
      </div>
    </article>
  );
}
