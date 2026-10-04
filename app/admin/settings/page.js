"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminFetch } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { SEASONAL_COLLECTIONS, normalizeSeasonalCollection } from "@/lib/seasonalCollection";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
  const { admin } = useAdminAuth();
  const [settings, setSettings] = useState({
    storeName: "",
    announcement: "",
    supportEmail: "",
    supportPhone: "",
    seasonalCollection: "winter",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!admin?.token) return;
    adminFetch("/api/admin/content?resource=settings", {}, admin.token)
      .then((data) =>
        setSettings({
          storeName: data.settings?.storeName || "",
          announcement: data.settings?.announcement || "",
          supportEmail: data.settings?.supportEmail || "",
          supportPhone: data.settings?.supportPhone || "",
          seasonalCollection: normalizeSeasonalCollection(data.settings?.seasonalCollection),
        })
      )
      .catch(() => {});
  }, [admin?.token]);

  const persist = async (next) => {
    setSaving(true);
    await adminFetch(
      "/api/admin/content",
      {
        method: "POST",
        body: JSON.stringify({ resource: "settings", data: next }),
      },
      admin.token
    );
    setSaving(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const save = async (event) => {
    event.preventDefault();
    await persist(settings);
  };

  const setSeason = async (season) => {
    const next = { ...settings, seasonalCollection: season };
    setSettings(next);
    await persist(next);
  };

  const season = normalizeSeasonalCollection(settings.seasonalCollection);

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

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-neutral-700">
            Seasonal collection
          </legend>
          <p className="mb-3 text-xs text-neutral-500">
            Shown on the home page. Both collections display new arrival products.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(SEASONAL_COLLECTIONS).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSeason(item.id)}
                disabled={saving}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors",
                  season === item.id
                    ? "border-brand-primary bg-brand-cream text-brand-primary"
                    : "border-border bg-white text-neutral-700 hover:border-brand-primary"
                )}
                aria-pressed={season === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </Button>
        {saved && <p className="text-sm text-success">Settings saved.</p>}
      </form>
    </div>
  );
}
