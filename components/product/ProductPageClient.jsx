"use client";

import { useEffect, useState } from "react";
import ProductPageView from "@/components/product/ProductPageView";

export default function ProductPageClient({ slug }) {
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, data: null, error: "" });
    fetch(`/api/store/products/${encodeURIComponent(slug)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "This product page failed to load.");
        }
        return data;
      })
      .then((data) => {
        if (!cancelled) setState({ loading: false, data, error: "" });
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            loading: false,
            data: null,
            error: error?.message || "This product page failed to load.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <p className="text-sm font-medium text-neutral-600">Loading product…</p>
      </div>
    );
  }

  if (state.error || !state.data?.product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-black text-neutral-900">This product page failed to load</h1>
        <p className="mt-4 text-sm text-neutral-600">{state.error || "Product not found."}</p>
      </div>
    );
  }

  return (
    <ProductPageView
      product={state.data.product}
      reviews={state.data.reviews || []}
      related={state.data.related || []}
      crumbs={state.data.crumbs || []}
      baseUrl={state.data.baseUrl || ""}
    />
  );
}
