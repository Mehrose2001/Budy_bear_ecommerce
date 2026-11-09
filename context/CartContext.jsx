"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDeliverySettings } from "@/context/DeliverySettingsContext";
import { resolveShippingCost } from "@/lib/deliverySettings";
import { readCart, writeCart } from "@/lib/storage";
import { getEffectivePrice } from "@/lib/productFilters";
import { getProductColors } from "@/lib/productImages";
import {
  firstInStockColor,
  firstInStockSize,
  getConfiguredSizes,
  getVariantQty,
  isSizeSoldOut,
} from "@/lib/variantStock";

const CartContext = createContext(null);

function createLineId(product, size, color) {
  return `${product.id}-${size}-${color}`;
}

export function CartProvider({ children }) {
  const deliverySettings = useDeliverySettings();
  const [items, setItems] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      writeCart(items);
    }
  }, [items, isReady]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const addItem = useCallback((product, { size, color, quantity = 1, openDrawer: shouldOpen = true } = {}) => {
    const colors = getProductColors(product);
    const selectedColor = color || firstInStockColor(product, colors);
    const configuredSizes = getConfiguredSizes(product);
    const selectedSize =
      size || firstInStockSize(product, selectedColor, configuredSizes);
    if (configuredSizes.length && isSizeSoldOut(product, selectedColor, selectedSize)) return;
    const maxStock = getVariantQty(product, selectedColor, selectedSize);
    if (maxStock <= 0) return;
    const lineId = createLineId(product, selectedSize, selectedColor);
    const basePrice = getEffectivePrice(product);

    setItems((current) => {
      const existing = current.find((item) => item.id === lineId);
      if (existing) {
        return current.map((item) =>
          item.id === lineId
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, maxStock),
                stock: maxStock,
              }
            : item
        );
      }

      return [
        ...current,
        {
          id: lineId,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          price: product.price,
          salePrice: product.salePrice,
          featured: Boolean(product.featured),
          newArrival: Boolean(product.newArrival),
          bestSeller: Boolean(product.bestSeller),
          basePrice,
          unitPrice: basePrice,
          size: selectedSize,
          color: selectedColor,
          quantity: Math.min(quantity, maxStock),
          stock: maxStock,
        },
      ];
    });

    if (shouldOpen) {
      setIsDrawerOpen(true);
    }
  }, []);

  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    setItems((current) =>
      current
        .map((item) => {
          if (item.id !== id) return item;
          const nextQuantity = Math.max(1, Math.min(quantity, item.stock));
          return { ...item, quantity: nextQuantity };
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const pricedItems = useMemo(
    () =>
      items.map((item) => {
        const base = Number(item.basePrice ?? item.unitPrice ?? item.salePrice ?? item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        return {
          ...item,
          basePrice: base,
          unitPrice: base,
          offerApplied: false,
          lineOriginal: base * quantity,
          linePayable: base * quantity,
          lineOfferDiscount: 0,
        };
      }),
    [items]
  );

  const summary = useMemo(() => {
    const listSubtotal = pricedItems.reduce(
      (total, item) => total + Number(item.price || 0) * item.quantity,
      0
    );
    const subtotal = pricedItems.reduce(
      (total, item) => total + item.basePrice * item.quantity,
      0
    );
    const saleDiscount = pricedItems.reduce(
      (total, item) =>
        total + Math.max(0, Number(item.price || 0) - item.basePrice) * item.quantity,
      0
    );
    const payableSubtotal = pricedItems.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0
    );
    const discount = saleDiscount;
    const shipping = resolveShippingCost(payableSubtotal, "standard", deliverySettings);

    return {
      listSubtotal,
      subtotal,
      saleDiscount,
      offerDiscount: 0,
      discount,
      shipping,
      total: payableSubtotal + shipping,
      itemCount: pricedItems.reduce((count, item) => count + item.quantity, 0),
    };
  }, [pricedItems, deliverySettings]);

  const value = {
    items: pricedItems,
    isReady,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    ...summary,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
