"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminFetch } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminBannersPage() {
  const { admin } = useAdminAuth();
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState({
    title: "",
    image: "/images/banners/hero-banner.jpg",
    href: "/products",
    active: true,
  });

  const load = useCallback(async () => {
    if (!admin?.token) return;
    const data = await adminFetch("/api/admin/content?resource=banners", {}, admin.token);
    setBanners(data.banners);
  }, [admin?.token]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const save = async (event) => {
    event.preventDefault();
    await adminFetch(
      "/api/admin/content",
      {
        method: "POST",
        body: JSON.stringify({ resource: "banners", data: form }),
      },
      admin.token
    );
    setForm({ title: "", image: "/images/banners/hero-banner.jpg", href: "/products", active: true });
    await load();
  };

  const remove = async (id) => {
    await adminFetch(`/api/admin/content?resource=banners&id=${id}`, { method: "DELETE" }, admin.token);
    await load();
  };

  return (
    <div>
      <AdminPageHeader title="Banners" description="Manage homepage and campaign imagery." />
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
        <Input
          label="Image path"
          value={form.image}
          onChange={(event) => setForm({ ...form, image: event.target.value })}
          required
        />
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
        <div>
          <Button type="submit">Save banner</Button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((banner) => (
          <article key={banner.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <p className="font-semibold text-brand-primary">{banner.title}</p>
            <p className="mt-1 truncate text-xs text-neutral-500">{banner.image}</p>
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
