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
import { useToast } from "@/context/ToastContext";

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  description: "",
  subcategories: "",
  image: "",
};

export default function AdminCategoriesPage() {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [mode, setMode] = useState("list");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!admin?.token) return;
    const data = await adminFetch("/api/admin/categories", {}, admin.token);
    setCategories(data.categories || []);
  }, [admin?.token]);

  useEffect(() => {
    load().catch((loadError) => {
      setError(loadError.message || "Unable to load categories.");
    });
  }, [load]);

  const openAdd = () => {
    setForm(emptyForm);
    setError("");
    setMode("add");
  };

  const openEdit = (category) => {
    setForm({
      id: category.id || category.slug,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      subcategories: (category.subcategories || []).join(", "),
      image: category.image || "",
    });
    setError("");
    setMode("edit");
  };

  const closeForm = () => {
    setForm(emptyForm);
    setError("");
    setMode("list");
  };

  const uploadThumbnail = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const data = await adminUploadFile(file, admin?.token, form.slug || "category", "categories");
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
    setSaving(true);
    try {
      await adminFetch(
        "/api/admin/categories",
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            id: form.id || form.slug || slugify(form.name),
            slug: form.slug || slugify(form.name),
            subcategories: form.subcategories
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          }),
        },
        admin.token
      );
      showToast(mode === "edit" ? "Category updated." : "Category added.");
      closeForm();
      await load();
    } catch (saveError) {
      setError(saveError.message || "Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category) => {
    if (!window.confirm(`Delete ${category.name}? Products in this category must be moved first.`)) {
      return;
    }
    try {
      await adminFetch(
        `/api/admin/categories?slug=${encodeURIComponent(category.id || category.slug)}`,
        { method: "DELETE" },
        admin.token
      );
      showToast("Category deleted.");
      if (form.id === category.id || form.slug === category.slug) closeForm();
      await load();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete category.");
      showToast(deleteError.message || "Unable to delete category.", "error");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdminPageHeader
        title="Categories"
        description="These categories power shop navigation. Thumbnails appear only in the homepage slider below the banner."
        action={
          mode === "list" ? (
            <Button type="button" onClick={openAdd}>
              Add category
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={closeForm}>
              Back to listing
            </Button>
          )
        }
      />

      {mode !== "list" ? (
        <form
          onSubmit={save}
          className="mb-6 grid shrink-0 gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm md:grid-cols-2"
        >
          <h3 className="text-lg font-black text-brand-primary md:col-span-2">
            {mode === "edit" ? "Edit category" : "Add category"}
          </h3>
          <Input
            label="Name"
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
                slug: mode === "add" ? slugify(event.target.value) : form.slug,
              })
            }
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
            <p className="mb-2 text-sm font-medium text-neutral-800">Slider thumbnail</p>
            <p className="mb-3 text-xs text-neutral-500">
              This image is used only in the category slider under the homepage banner.
            </p>
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
                  {uploading ? "Uploading..." : "Upload from device"}
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

          <div className="flex gap-3 md:col-span-2">
            <Button type="submit" disabled={uploading || saving}>
              {saving ? "Saving..." : mode === "edit" ? "Update category" : "Save category"}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {error && mode === "list" ? <p className="mb-3 text-sm text-error">{error}</p> : null}

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
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  No categories yet. Use Add category to create the first one.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id || category.slug} className="border-b border-border/70">
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
                  <td className="px-4 py-3">{(category.subcategories || []).join(", ")}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-sm font-semibold text-brand-primary"
                      onClick={() => openEdit(category)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ml-3 text-sm font-semibold text-error"
                      onClick={() => remove(category)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTable>
    </div>
  );
}
