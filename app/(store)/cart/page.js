"use client";

import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, subtotal, discount, shipping, total, itemCount } = useCart();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cart" },
        ]}
      />
      <h1 className="text-3xl font-black tracking-tight text-neutral-900">
        Shopping Cart
      </h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <h2 className="text-xl font-bold text-neutral-900">Your cart is empty</h2>
          <p className="mt-2 text-neutral-500">
            Browse the shop and add items you love.
          </p>
          <Button href="/products" className="mt-6">
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-3xl border border-neutral-200 bg-white px-5">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
          <CartSummary
            subtotal={subtotal}
            discount={discount}
            shipping={shipping}
            total={total}
            itemCount={itemCount}
          />
        </div>
      )}
    </div>
  );
}
