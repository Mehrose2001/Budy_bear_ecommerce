"use client";

import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import { DeliverySettingsProvider } from "@/context/DeliverySettingsContext";
import { StoreOfferProvider } from "@/context/StoreOfferContext";
import OfferPopup from "@/components/store/OfferPopup";
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
            <StoreOfferProvider>
            <DeliverySettingsProvider>
            <CartProvider>
              <WishlistProvider>
                <OrdersProvider>
                  <QuickViewProvider>
                    {children}
                    <RecoveryRedirect />
                    <CartDrawer />
                    <OfferPopup />
                    <RouteLoader />
                  </QuickViewProvider>
                </OrdersProvider>
              </WishlistProvider>
            </CartProvider>
            </DeliverySettingsProvider>
            </StoreOfferProvider>
          </CustomerAuthProvider>
        </AdminAuthProvider>
      </ToastProvider>
    </LoadingProvider>
  );
}
