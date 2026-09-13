"use client";

import { useEffect, useState } from "react";
import ProductGrid from "@/components/product/ProductGrid";
import { getProductById } from "@/data/products";
import { readRecentlyViewed, trackRecentlyViewed } from "@/lib/storage";

export default function RecentlyViewed({ currentProductId }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    trackRecentlyViewed(currentProductId);
    const ids = readRecentlyViewed().filter((id) => id !== currentProductId);
    setProducts(ids.map(getProductById).filter(Boolean).slice(0, 5));
  }, [currentProductId]);

  if (!products.length) return null;

  return (
    <section className="mt-16">
      <h2 className="mb-6 text-2xl font-black text-neutral-900">
        Recently viewed
      </h2>
      <ProductGrid products={products} className="xl:grid-cols-5" />
    </section>
  );
}
