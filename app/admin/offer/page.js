"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminFetch } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/context/ToastContext";
import { EMPTY_OFFER, normalizeOffer } from "@/lib/storeOffer";

export default function AdminOfferPage() {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState(null);
  const [offer, setOffer] = useState(EMPTY_OFFER);
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

  const save = async (event) => {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    const nextOffer = normalizeOffer(offer);
    try {
      const data = await adminFetch(
        "/api/admin/content",
        {
          method: "POST",
          body: JSON.stringify({
            resource: "settings",
            data: { ...settings, offer: nextOffer },
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

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <AdminPageHeader
        title="Show offer popup"
        description="Turn on a storewide discount. Shoppers see it once, and the percent is applied on every product."
      />
      <form
        onSubmit={save}
        className="grid max-w-xl gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm"
      >
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
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={offer.enabled}
            onChange={(event) => setOffer({ ...offer, enabled: event.target.checked })}
          />
          Enable on every product
        </label>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <Button type="submit" disabled={saving || !settings}>
          {saving ? "Saving..." : "Save offer"}
        </Button>
      </form>
    </div>
  );
}
