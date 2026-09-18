"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import { adminFetch } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";

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
    await load();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
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
                  <input
                    type="number"
                    min="0"
                    defaultValue={product.stock}
                    key={`${product.id}-${product.stock}`}
                    onBlur={(event) => {
                      const next = Number(event.target.value);
                      if (next !== product.stock) updateStock(product, next);
                    }}
                    className="h-10 w-24 rounded-xl border border-border px-3"
                  />
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
