"use client";

import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { QuickViewProvider } from "@/context/QuickViewContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import RouteLoader from "@/components/layout/RouteLoader";
import CartDrawer from "@/components/cart/CartDrawer";

export default function AppProviders({ children }) {
  return (
    <LoadingProvider>
      <ToastProvider>
        <AdminAuthProvider>
          <CustomerAuthProvider>
            <CartProvider>
              <WishlistProvider>
                <QuickViewProvider>
                  {children}
                  <CartDrawer />
                  <RouteLoader />
                </QuickViewProvider>
              </WishlistProvider>
            </CartProvider>
          </CustomerAuthProvider>
        </AdminAuthProvider>
      </ToastProvider>
    </LoadingProvider>
  );
}
