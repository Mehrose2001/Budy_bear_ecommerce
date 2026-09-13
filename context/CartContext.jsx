"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FREE_DELIVERY_THRESHOLD, SHIPPING_FEE } from "@/data/store";
import { readCart, writeCart } from "@/lib/storage";
import { getEffectivePrice } from "@/lib/productFilters";

const CartContext = createContext(null);

function createLineId(product, size, color) {
  return `${product.id}-${size}-${color}`;
}

export function CartProvider({ children }) {
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
    const selectedSize = size || product.sizes[0];
    const selectedColor = color || product.colors[0];
    const lineId = createLineId(product, selectedSize, selectedColor);
    const unitPrice = getEffectivePrice(product);

    setItems((current) => {
      const existing = current.find((item) => item.id === lineId);
      if (existing) {
        return current.map((item) =>
          item.id === lineId
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, product.stock),
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
          unitPrice,
          size: selectedSize,
          color: selectedColor,
          quantity: Math.min(quantity, product.stock),
          stock: product.stock,
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

  const summary = useMemo(() => {
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const discountedSubtotal = items.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0
    );
    const discount = subtotal - discountedSubtotal;
    const shipping =
      discountedSubtotal === 0 || discountedSubtotal >= FREE_DELIVERY_THRESHOLD
        ? 0
        : SHIPPING_FEE;

    return {
      subtotal,
      discount,
      shipping,
      total: discountedSubtotal + shipping,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
    };
  }, [items]);

  const value = {
    items,
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
