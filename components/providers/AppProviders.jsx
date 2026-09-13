"use client";

import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { QuickViewProvider } from "@/context/QuickViewContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import CartDrawer from "@/components/cart/CartDrawer";

export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AdminAuthProvider>
        <CartProvider>
          <WishlistProvider>
            <QuickViewProvider>
              {children}
              <CartDrawer />
            </QuickViewProvider>
          </WishlistProvider>
        </CartProvider>
      </AdminAuthProvider>
    </ToastProvider>
  );
}
