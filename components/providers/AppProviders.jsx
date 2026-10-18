"use client";

import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { QuickViewProvider } from "@/context/QuickViewContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import RouteLoader from "@/components/layout/RouteLoader";
import CartDrawer from "@/components/cart/CartDrawer";
import RecoveryRedirect from "@/components/auth/RecoveryRedirect";

export default function AppProviders({ children }) {
  return (
    <LoadingProvider>
      <ToastProvider>
        <AdminAuthProvider>
          <CustomerAuthProvider>
            <CartProvider>
              <WishlistProvider>
                <OrdersProvider>
                  <QuickViewProvider>
                    {children}
                    <RecoveryRedirect />
                    <CartDrawer />
                    <RouteLoader />
                  </QuickViewProvider>
                </OrdersProvider>
              </WishlistProvider>
            </CartProvider>
          </CustomerAuthProvider>
        </AdminAuthProvider>
      </ToastProvider>
    </LoadingProvider>
  );
}
