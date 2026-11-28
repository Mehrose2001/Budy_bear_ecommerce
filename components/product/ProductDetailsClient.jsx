"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import { getProductColors } from "@/lib/productImages";
import { firstInStockColor } from "@/lib/variantStock";

export default function ProductDetailsClient({ product }) {
  const router = useRouter();
  const colors = getProductColors(product);
  const [selectedColor, setSelectedColor] = useState(() => firstInStockColor(product, colors));

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
