"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminFetch, adminUploadFile } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/context/ToastContext";

const emptyForm = {
  title: "",
  image: "",
  href: "/products",
  active: true,
};

export default function AdminBannersPage() {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!admin?.token) return;
    const data = await adminFetch("/api/admin/content?resource=banners", {}, admin.token);
    setBanners(data.banners || []);
  }, [admin?.token]);

  useEffect(() => {
    load().catch((loadError) => {
      setError(loadError.message || "Unable to load banners.");
    });
  }, [load]);

  const uploadImage = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const data = await adminUploadFile(file, admin?.token, form.id || "banner", "banners");
      setForm((current) => ({ ...current, image: data.url }));
    } catch (uploadError) {
      setError(uploadError.message || "Could not upload the banner image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.image) {
      setError("Upload a banner image from your device.");
      return;
    }
    setSaving(true);
    try {
      await adminFetch(
        "/api/admin/content",
        {
          method: "POST",
          body: JSON.stringify({ resource: "banners", data: form }),
        },
        admin.token
      );
      showToast(form.id ? "Banner updated." : "Banner saved.");
      setForm(emptyForm);
      await load();
    } catch (saveError) {
      setError(saveError.message || "Unable to save banner.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await adminFetch(`/api/admin/content?resource=banners&id=${id}`, { method: "DELETE" }, admin.token);
    if (form.id === id) setForm(emptyForm);
    await load();
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <AdminPageHeader title="Banners" description="Upload homepage and campaign images from your device." />
      <form
        onSubmit={save}
        className="mb-8 grid gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm"
      >
        <Input
          label="Title"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
        />
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-800">Banner image</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative h-24 w-40 overflow-hidden rounded-xl bg-brand-cream ring-1 ring-border">
              {form.image ? (
                <Image src={form.image} alt="" fill className="object-cover" sizes="160px" />
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
                onChange={(event) => uploadImage(event.target.files?.[0])}
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
                <p className="max-w-xs truncate text-xs text-neutral-500">{form.image}</p>
              ) : null}
            </div>
          </div>
        </div>
        <Input
          label="Link"
          value={form.href}
          onChange={(event) => setForm({ ...form, href: event.target.value })}
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm({ ...form, active: event.target.checked })}
          />
          Active
        </label>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={uploading || saving}>
            {saving ? "Saving..." : form.id ? "Update banner" : "Save banner"}
          </Button>
          {form.id ? (
            <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((banner) => (
          <article key={banner.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="relative mb-3 h-36 overflow-hidden rounded-xl bg-brand-cream">
              {banner.image ? (
                <Image src={banner.image} alt="" fill className="object-cover" sizes="400px" />
              ) : null}
            </div>
            <p className="font-semibold text-brand-primary">{banner.title}</p>
            <p className="mt-1 text-sm">{banner.active ? "Active" : "Hidden"} · {banner.href}</p>
            <div className="mt-3 flex gap-3">
              <button type="button" className="text-sm font-semibold text-brand-primary" onClick={() => setForm(banner)}>
                Edit
              </button>
              <button type="button" className="text-sm font-semibold text-error" onClick={() => remove(banner.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
