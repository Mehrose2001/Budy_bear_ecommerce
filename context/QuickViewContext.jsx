"use client";

import { createContext, useCallback, useContext, useState } from "react";
import QuickView from "@/components/product/QuickView";

const QuickViewContext = createContext(null);

export function QuickViewProvider({ children }) {
  const [product, setProduct] = useState(null);

  const openQuickView = useCallback((nextProduct) => {
    setProduct(nextProduct);
  }, []);

  const closeQuickView = useCallback(() => {
    setProduct(null);
  }, []);

  return (
    <QuickViewContext.Provider value={{ openQuickView, closeQuickView }}>
      {children}
      <QuickView product={product} onClose={closeQuickView} />
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  const context = useContext(QuickViewContext);
  if (!context) {
    throw new Error("useQuickView must be used within QuickViewProvider");
  }
  return context;
}
