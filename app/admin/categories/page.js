"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminFetch, adminUploadFile } from "@/lib/adminApi";
import { slugify } from "@/lib/utils";
import { useAdminAuth } from "@/context/AdminAuthContext";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  subcategories: "",
  image: "",
};

export default function AdminCategoriesPage() {
  const { admin } = useAdminAuth();
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!admin?.token) return;
    const data = await adminFetch("/api/admin/categories", {}, admin.token);
    setCategories(data.categories);
  }, [admin?.token]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const uploadThumbnail = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const data = await adminUploadFile(file, admin?.token);
      setForm((current) => ({ ...current, image: data.url }));
    } catch (uploadError) {
      setError(uploadError.message || "Could not upload the thumbnail.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setError("");
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
    setForm(emptyForm);
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
        description="Organize the shop navigation and product grouping. The thumbnail appears on the homepage category strip."
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
          <p className="mb-2 text-sm font-medium text-neutral-800">Landing page thumbnail</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative h-24 w-20 overflow-hidden rounded-xl bg-brand-cream ring-1 ring-border">
              {form.image ? (
                <Image src={form.image} alt="" fill className="object-cover" sizes="80px" />
              ) : (
                <span className="flex h-full items-center justify-center px-2 text-center text-[10px] text-neutral-400">
                  No image
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) => uploadThumbnail(event.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Uploading..." : "Upload thumbnail"}
              </Button>
              {form.image ? (
                <button
                  type="button"
                  className="text-left text-xs font-semibold text-error"
                  onClick={() => setForm({ ...form, image: "" })}
                >
                  Remove image
                </button>
              ) : null}
            </div>
          </div>
          {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
        </div>

        <div className="md:col-span-2">
          <Button type="submit" disabled={uploading}>
            Save category
          </Button>
        </div>
      </form>

      <AdminTable>
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-brand-cream">
            <tr>
              <th className="px-4 py-3 font-medium">Thumbnail</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Subcategories</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.slug} className="border-b border-border/70">
                <td className="px-4 py-3">
                  <span className="relative inline-block h-12 w-10 overflow-hidden rounded-lg bg-brand-cream">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : null}
                  </span>
                </td>
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
                        image: category.image || "",
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
