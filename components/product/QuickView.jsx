"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import { getProductColors } from "@/lib/productImages";
import { applyReviewStatsToProduct } from "@/lib/ratings";

export default function QuickView({ product, onClose }) {
  const router = useRouter();
  const [displayProduct, setDisplayProduct] = useState(product);
  const [selectedColor, setSelectedColor] = useState(getProductColors(product)[0]);

  useEffect(() => {
    if (!product?.id) {
      setDisplayProduct(null);
      return;
    }
    setDisplayProduct(product);
    setSelectedColor(getProductColors(product)[0]);
    let ignore = false;
    fetch(`/api/reviews?productId=${encodeURIComponent(product.id)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (ignore) return;
        setDisplayProduct(applyReviewStatsToProduct(product, data.reviews || []));
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [product]);

  if (!displayProduct) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Quick View"
      labelledBy="quick-view-title"
      className="max-w-4xl"
    >
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery product={displayProduct} compact selectedColor={selectedColor} />
        <ProductInfo
          product={displayProduct}
          compact
          onColorChange={setSelectedColor}
          onViewFull={() => {
            const slug = displayProduct.slug;
            onClose();
            router.push(`/product/${slug}`);
          }}
          onAdded={(buyNow) => {
            onClose();
            if (buyNow) {
              router.push("/cart");
            }
          }}
        />
      </div>
    </Modal>
  );
}
