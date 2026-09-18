"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminFetch } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminSettingsPage() {
  const { admin } = useAdminAuth();
  const [settings, setSettings] = useState({
    storeName: "",
    announcement: "",
    supportEmail: "",
    supportPhone: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!admin?.token) return;
    adminFetch("/api/admin/content?resource=settings", {}, admin.token)
      .then((data) => setSettings(data.settings))
      .catch(() => {});
  }, [admin?.token]);

  const save = async (event) => {
    event.preventDefault();
    await adminFetch(
      "/api/admin/content",
      {
        method: "POST",
        body: JSON.stringify({ resource: "settings", data: settings }),
      },
      admin.token
    );
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <AdminPageHeader
        title="Store settings"
        description="Update storefront copy used across the shop."
      />
      <form onSubmit={save} className="max-w-xl space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <Input
          label="Store name"
          value={settings.storeName}
          onChange={(event) => setSettings({ ...settings, storeName: event.target.value })}
        />
        <Input
          label="Announcement bar"
          value={settings.announcement}
          onChange={(event) => setSettings({ ...settings, announcement: event.target.value })}
        />
        <Input
          label="Support email"
          type="email"
          value={settings.supportEmail}
          onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })}
        />
        <Input
          label="Support phone"
          value={settings.supportPhone}
          onChange={(event) => setSettings({ ...settings, supportPhone: event.target.value })}
        />
        <Button type="submit">Save settings</Button>
        {saved && <p className="text-sm text-success">Settings saved.</p>}
      </form>
    </div>
  );
}
