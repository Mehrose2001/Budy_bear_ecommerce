"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ProductForm from "@/components/admin/ProductForm";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { adminFetch } from "@/lib/adminApi";
import { formatPrice } from "@/lib/utils";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminProductsPage() {
  const { admin } = useAdminAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!admin?.token) return;
    const [productData, categoryData] = await Promise.all([
      adminFetch("/api/admin/products", {}, admin.token),
      adminFetch("/api/admin/categories", {}, admin.token),
    ]);
    setProducts(productData.products);
    setCategories(categoryData.categories);
  }, [admin?.token]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const saveProduct = async (payload) => {
    await adminFetch(
      "/api/admin/products",
      {
        method: payload.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      },
      admin.token
    );
    setOpen(false);
    setEditing(null);
    await load();
  };

  const removeProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await adminFetch(`/api/admin/products?id=${id}`, { method: "DELETE" }, admin.token);
    await load();
  };

  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Add, edit, and manage catalog items shown on the store."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Add product
          </Button>
        }
      />

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products"
        className="mb-4 h-11 w-full max-w-sm rounded-xl border border-border bg-white px-4 text-sm"
      />

      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-brand-cream/60 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Flags</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b border-border/70">
                <td className="px-4 py-3 font-semibold text-brand-primary">{product.name}</td>
                <td className="px-4 py-3">
                  {product.category} / {product.subcategory}
                </td>
                <td className="px-4 py-3">{formatPrice(product.salePrice || product.price)}</td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className="px-4 py-3 text-xs">
                  {[product.featured && "Featured", product.newArrival && "New", product.bestSeller && "Best"].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-sm font-semibold text-brand-primary"
                      onClick={() => {
                        setEditing(product);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-error"
                      onClick={() => removeProduct(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit product" : "Add product"}
      >
        <ProductForm
          product={editing}
          categories={categories}
          onCancel={() => setOpen(false)}
          onSave={saveProduct}
        />
      </Modal>
    </div>
  );
}
