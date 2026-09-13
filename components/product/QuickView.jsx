"use client";

import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";

export default function QuickView({ product, onClose }) {
  const router = useRouter();

  if (!product) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Quick View"
      labelledBy="quick-view-title"
      className="max-w-4xl"
    >
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery product={product} compact />
        <ProductInfo
          product={product}
          compact
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
