"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import Button from "@/components/ui/Button";

export default function CartDrawer() {
  const pathname = usePathname();
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    subtotal,
    discount,
    shipping,
    total,
    itemCount,
  } = useCart();

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return undefined;
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen, pathname]);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${
          isDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isDrawerOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!isDrawerOpen}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-neutral-900">Your cart</h2>
            <p className="text-sm text-neutral-500">{itemCount} items</p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-brand-cream"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length ? (
            items.map((item) => <CartItem key={item.id} item={item} />)
          ) : (
            <div className="py-16 text-center">
              <p className="font-semibold text-neutral-900">Your cart is empty</p>
              <p className="mt-2 text-sm text-neutral-500">
                Add a few favorites and they will show up here.
              </p>
              <Button href="/products" className="mt-6" onClick={closeDrawer}>
                Shop now
              </Button>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-neutral-200 p-5">
            <CartSummary
              subtotal={subtotal}
              discount={discount}
              shipping={shipping}
              total={total}
              itemCount={itemCount}
              showCheckout={false}
            />
            <div className="mt-4 grid gap-3">
              <Button href="/cart" className="w-full" onClick={closeDrawer}>
                View cart
              </Button>
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="text-center text-sm font-semibold text-brand-primary hover:underline"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
