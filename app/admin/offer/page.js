"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import OfferPopupCard from "@/components/store/OfferPopupCard";
import { adminFetch, adminUploadFile } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/context/ToastContext";
import { EMPTY_OFFER, normalizeOffer } from "@/lib/storeOffer";

export default function AdminOfferPage() {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState(null);
  const [offer, setOffer] = useState(EMPTY_OFFER);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!admin?.token) return;
    adminFetch("/api/admin/content?resource=settings", {}, admin.token)
      .then((data) => {
        setSettings(data.settings || {});
        setOffer(normalizeOffer(data.settings?.offer));
      })
      .catch((loadError) => setError(loadError.message || "Unable to load the offer."));
  }, [admin?.token]);

  const uploadImage = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const data = await adminUploadFile(file, admin?.token, "offer-popup", "offer");
      setOffer((current) => ({ ...current, image: data.url }));
    } catch (uploadError) {
      setError(uploadError.message || "Could not upload the offer image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    const nextOffer = normalizeOffer(offer);
    const { seasonalBanner: _seasonalBanner, ...storeSettings } = settings;
    try {
      const data = await adminFetch(
        "/api/admin/content",
        {
          method: "POST",
          body: JSON.stringify({
            resource: "settings",
            data: { ...storeSettings, offer: nextOffer },
          }),
        },
        admin.token
      );
      setOffer(normalizeOffer(data.settings?.offer || nextOffer));
      setSettings(data.settings || settings);
      showToast(nextOffer.enabled ? "Offer popup is on." : "Offer popup saved.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save the offer.");
    } finally {
      setSaving(false);
    }
  };

  const previewOffer = normalizeOffer({
    ...offer,
    enabled: true,
    percent: offer.percent || 15,
  });

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <AdminPageHeader
        title="Show offer popup"
        description="Upload a banner image, choose which product groups get the discount, and set the popup message."
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] xl:items-start">
        <form
          onSubmit={save}
          className="grid max-w-xl gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm"
        >
          <div>
            <p className="mb-1 text-sm font-medium text-neutral-800">Offer banner image</p>
            <p className="mb-3 text-xs text-neutral-500">
              Shown at the top of the popup. Use a bright kids-wear photo; keep faces and text near the center.
            </p>
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative h-32 w-44 overflow-hidden rounded-xl bg-brand-cream ring-1 ring-border">
                {offer.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={offer.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Image src="/images/banners/banner_image_4k.jpeg" alt="" fill className="object-cover" sizes="176px" />
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
                {offer.image ? (
                  <button
                    type="button"
                    className="text-left text-xs font-semibold text-neutral-500 hover:text-error"
                    onClick={() => setOffer({ ...offer, image: "" })}
                  >
                    Remove image (use default banner)
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-neutral-800">Offer message</span>
            <textarea
              value={offer.message}
              onChange={(event) => setOffer({ ...offer, message: event.target.value })}
              rows={4}
              maxLength={280}
              placeholder="Soft styles, happier prices. Take 15% off today."
              className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <Input
            label="Discount %"
            type="number"
            min="0"
            max="90"
            value={offer.percent}
            onChange={(event) => setOffer({ ...offer, percent: event.target.value })}
            required
          />
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-neutral-800">
              Apply discount to
            </legend>
            <p className="mb-3 text-xs text-neutral-500">
              Select one or more groups. If none are checked, the discount applies to all products
              (same as before).
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                ["newArrivals", "New Arrivals"],
                ["saleItems", "Sale Items"],
                ["featuredItems", "Featured Items"],
              ].map(([key, label]) => (
                <label key={key} className="inline-flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={Boolean(offer[key])}
                    onChange={(event) => setOffer({ ...offer, [key]: event.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={offer.enabled}
              onChange={(event) => setOffer({ ...offer, enabled: event.target.checked })}
            />
            Enable offer popup and discounts
          </label>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <Button type="submit" disabled={saving || !settings || uploading}>
            {saving ? "Saving..." : "Save offer"}
          </Button>
        </form>

        <div className="xl:sticky xl:top-6">
          <p className="mb-3 text-sm font-semibold text-brand-primary">Live preview</p>
          <div className="rounded-2xl border border-dashed border-border bg-brand-cream/60 p-4">
            <OfferPopupCard offer={previewOffer} preview />
          </div>
        </div>
      </div>
    </div>
  );
}
