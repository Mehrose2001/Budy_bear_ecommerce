"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import { adminFetch } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";

function StockField({ product, onSave }) {
  const [value, setValue] = useState(String(product.stock ?? 0));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setValue(String(product.stock ?? 0));
    setDirty(false);
  }, [product.id, product.stock]);

  const commit = () => {
    const next = Math.max(0, Number(value) || 0);
    if (next === Number(product.stock)) {
      setDirty(false);
      return;
    }
    onSave(product, next).finally(() => setDirty(false));
  };

  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        setDirty(true);
      }}
      onBlur={() => {
        if (dirty) commit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
          event.currentTarget.blur();
        }
      }}
      className="h-10 w-24 rounded-xl border border-border px-3"
      aria-label={`Stock for ${product.name}`}
    />
  );
}

export default function AdminInventoryPage() {
  const { admin } = useAdminAuth();
  const [products, setProducts] = useState([]);

  const load = useCallback(async () => {
    if (!admin?.token) return;
    const data = await adminFetch("/api/admin/products", {}, admin.token);
    setProducts(data.products);
  }, [admin?.token]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const updateStock = async (product, stock) => {
    await adminFetch(
      "/api/admin/products",
      {
        method: "PUT",
        body: JSON.stringify({ ...product, stock }),
      },
      admin.token
    );
    setProducts((current) =>
      current.map((item) => (item.id === product.id ? { ...item, stock } : item))
    );
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-col">
      <AdminPageHeader
        title="Inventory"
        description="Adjust stock levels for products currently on the store."
      />
      <AdminTable>
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-brand-cream">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU / ID</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border/70">
                <td className="px-4 py-3 font-semibold text-brand-primary">{product.name}</td>
                <td className="px-4 py-3">{product.id}</td>
                <td className="px-4 py-3">
                  {product.variantStock && Object.keys(product.variantStock).length ? (
                    <p className="text-xs text-neutral-600">
                      {Object.entries(product.variantStock)
                        .map(([color, sizes]) => {
                          const total = Object.values(sizes).reduce(
                            (sum, qty) => sum + Number(qty || 0),
                            0
                          );
                          return `${color} ${total}`;
                        })
                        .join(" · ")}
                    </p>
                  ) : (
                    <StockField product={product} onSave={updateStock} />
                  )}
                </td>
                <td className="px-4 py-3">
                  {product.stock === 0
                    ? "Out of stock"
                    : product.stock < 8
                      ? "Low"
                      : "In stock"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
    </div>
  );
}
