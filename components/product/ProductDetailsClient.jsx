"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";

export default function ProductDetailsClient({ product }) {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <ProductGallery product={product} selectedColor={selectedColor} />
      <ProductInfo
        product={product}
        onColorChange={setSelectedColor}
        onAdded={(buyNow) => {
          if (buyNow) {
            router.push("/cart");
          }
        }}
      />
    </div>
  );
}
