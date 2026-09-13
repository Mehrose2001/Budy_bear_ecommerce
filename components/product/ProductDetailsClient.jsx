"use client";

import { useRouter } from "next/navigation";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";

export default function ProductDetailsClient({ product }) {
  const router = useRouter();

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <ProductGallery product={product} />
      <ProductInfo
        product={product}
        onAdded={(buyNow) => {
          if (buyNow) {
            router.push("/cart");
          }
        }}
      />
    </div>
  );
}
