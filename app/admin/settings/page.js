"use client";

import { useEffect, useRef, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminFetch, adminUploadFile } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  SEASONAL_COLLECTIONS,
  normalizeSeasonalBanners,
  normalizeSeasonalCollection,
} from "@/lib/seasonalCollection";
import { DEFAULT_DELIVERY_SETTINGS } from "@/lib/deliverySettings";
import { cn } from "@/lib/utils";

function formSettings(settings) {
  return {
    storeName: settings?.storeName || "",
    announcement: settings?.announcement || "",
    deliveryFee: settings?.deliveryFee ?? DEFAULT_DELIVERY_SETTINGS.deliveryFee,
    freeDeliveryThreshold:
      settings?.freeDeliveryThreshold ?? DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold,
    supportEmail: settings?.supportEmail || "",
    supportPhone: settings?.supportPhone || "",
    seasonalCollection: normalizeSeasonalCollection(settings?.seasonalCollection),
    seasonalBanner: normalizeSeasonalBanners(settings?.seasonalBanner),
  };
}

export default function AdminSettingsPage() {
  const { admin } = useAdminAuth();
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState(formSettings(null));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!admin?.token) return;
    adminFetch("/api/admin/content?resource=settings", {}, admin.token)
      .then((data) => setSettings(formSettings(data.settings)))
      .catch(() => {});
  }, [admin?.token]);

  const persist = async (next) => {
    setSaving(true);
    setError("");
    try {
      const data = await adminFetch(
        "/api/admin/content",
        {
          method: "POST",
          body: JSON.stringify({ resource: "settings", data: next }),
        },
        admin.token
      );
      if (data.settings) setSettings(formSettings(data.settings));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (saveError) {
      setError(saveError.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
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
  const banners = normalizeSeasonalBanners(settings.seasonalBanner);
  const banner = banners[season];
  const seasonLabel = SEASONAL_COLLECTIONS[season].label;

  const patchBanner = (patch, seasonId = season) => {
    setSettings((current) => {
      const all = normalizeSeasonalBanners(current.seasonalBanner);
      return {
        ...current,
        seasonalBanner: {
          ...all,
          [seasonId]: { ...all[seasonId], ...patch },
        },
      };
    });
  };

  const uploadImage = async (file) => {
    if (!file) return;
    const seasonId = season;
    setError("");
    setUploading(true);
    try {
      const data = await adminUploadFile(file, admin?.token, "seasonal", "banners");
      patchBanner({ image: data.url }, seasonId);
    } catch (uploadError) {
      setError(uploadError.message || "Could not upload the background image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
          label="Delivery amount (Rs.)"
          type="number"
          min="0"
          step="1"
          value={settings.deliveryFee}
          onChange={(event) =>
            setSettings({ ...settings, deliveryFee: event.target.value })
          }
          required
        />
        <p className="-mt-2 text-xs text-neutral-500">
          Standard delivery charge applied when the order is below the free-delivery threshold.
        </p>
        <Input
          label="Amount after delivery applied (Rs.)"
          type="number"
          min="0"
          step="1"
          value={settings.freeDeliveryThreshold}
          onChange={(event) =>
            setSettings({ ...settings, freeDeliveryThreshold: event.target.value })
          }
          required
        />
        <p className="-mt-2 text-xs text-neutral-500">
          Minimum order value for free standard delivery across the cart, checkout, and orders.
        </p>
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

        <fieldset className="space-y-4">
          <legend className="mb-2 block text-sm font-medium text-neutral-700">
            Seasonal collection
          </legend>
          <p className="text-xs text-neutral-500">
            Shown on the home page. Both collections display new arrival products.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(SEASONAL_COLLECTIONS).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSeason(item.id)}
                disabled={saving || uploading}
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

          <div>
            <p className="mb-1 text-sm font-medium text-neutral-700">Background image</p>
            <p className="mb-3 text-xs text-neutral-500">
              Seasonal photo for the {seasonLabel} banner. Leave empty to keep the current artwork.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative h-28 w-full overflow-hidden rounded-xl bg-brand-cream ring-1 ring-border sm:h-24 sm:w-40">
                {banner.image ? (
                  <img src={banner.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <img
                    src={SEASONAL_COLLECTIONS[season].image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  className="hidden"
                  onChange={(event) => uploadImage(event.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading || saving}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Uploading..." : "Upload from device"}
                </Button>
                {banner.image ? (
                  <button
                    type="button"
                    className="text-left text-xs font-semibold text-neutral-500 hover:text-error"
                    onClick={() => patchBanner({ image: "" })}
                  >
                    Remove image
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <Input
            label="Marketing text"
            value={banner.text}
            maxLength={180}
            placeholder="Summer Sale – Up to 50% OFF"
            onChange={(event) => patchBanner({ text: event.target.value })}
          />
          <p className="-mt-2 text-xs text-neutral-500">
            Shown on the {seasonLabel} banner. Save settings to publish it.
          </p>
        </fieldset>

        {error ? <p className="text-sm text-error">{error}</p> : null}
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Saving..." : "Save settings"}
        </Button>
        {saved && <p className="text-sm text-success">Settings saved.</p>}
      </form>
    </div>
  );
}
