"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminFetch } from "@/lib/adminApi";
import { slugify } from "@/lib/utils";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminCategoriesPage() {
  const { admin } = useAdminAuth();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    subcategories: "",
  });

  const load = useCallback(async () => {
    if (!admin?.token) return;
    const data = await adminFetch("/api/admin/categories", {}, admin.token);
    setCategories(data.categories);
  }, [admin?.token]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const save = async (event) => {
    event.preventDefault();
    await adminFetch(
      "/api/admin/categories",
      {
        method: "POST",
        body: JSON.stringify({
          ...form,
          slug: form.slug || slugify(form.name),
          subcategories: form.subcategories
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      },
      admin.token
    );
    setForm({ name: "", slug: "", description: "", subcategories: "" });
    await load();
  };

  const remove = async (slug) => {
    if (!window.confirm("Delete this category?")) return;
    await adminFetch(`/api/admin/categories?slug=${slug}`, { method: "DELETE" }, admin.token);
    await load();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdminPageHeader
        title="Categories"
        description="Organize the shop navigation and product grouping."
      />

      <form
        onSubmit={save}
        className="mb-6 grid shrink-0 gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm md:grid-cols-2"
      >
        <Input
          label="Name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
        <Input
          label="Slug"
          value={form.slug}
          onChange={(event) => setForm({ ...form, slug: event.target.value })}
        />
        <Input
          label="Description"
          className="md:col-span-2"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <Input
          label="Subcategories (comma separated)"
          className="md:col-span-2"
          value={form.subcategories}
          onChange={(event) => setForm({ ...form, subcategories: event.target.value })}
        />
        <div className="md:col-span-2">
          <Button type="submit">Save category</Button>
        </div>
      </form>

      <AdminTable>
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-brand-cream">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Subcategories</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.slug} className="border-b border-border/70">
                <td className="px-4 py-3 font-semibold text-brand-primary">{category.name}</td>
                <td className="px-4 py-3">{category.slug}</td>
                <td className="px-4 py-3">{category.subcategories?.join(", ")}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-sm font-semibold text-brand-primary"
                    onClick={() =>
                      setForm({
                        name: category.name,
                        slug: category.slug,
                        description: category.description || "",
                        subcategories: (category.subcategories || []).join(", "),
                      })
                    }
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ml-3 text-sm font-semibold text-error"
                    onClick={() => remove(category.slug)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
    </div>
  );
}
