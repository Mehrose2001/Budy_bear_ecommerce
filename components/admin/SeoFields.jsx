"use client";

import { useRef, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { adminUploadFile } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { absoluteUrl, buildMetadata, lengthWarning, siteBase } from "@/data/seo";

function countHint(value, min, max) {
  const length = String(value || "").trim().length;
  const warning = lengthWarning("This field", value, min, max);
  return { length, warning: length ? warning : "" };
}

export function CountedInput({ label, value, onChange, min, max, multiline = false }) {
  const hint = countHint(value, min, max);
  return (
    <div>
      {multiline ? (
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">{label}</span>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
        </label>
      ) : (
        <Input label={label} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
      <p className={`mt-1 text-xs ${hint.warning ? "text-amber-700" : "text-neutral-500"}`}>
        {hint.length} characters. Recommended {min}–{max}.
        {hint.warning ? ` ${hint.warning}` : ""}
      </p>
    </div>
  );
}

export function ImageField({ label, value, onChange }) {
  const { admin } = useAdminAuth();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const data = await adminUploadFile(file, admin?.token, "seo", "banners");
      onChange(data.url || "");
    } catch (uploadError) {
      setError(uploadError.message || "Could not upload the image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <Input label={label} value={value} onChange={(event) => onChange(event.target.value)} placeholder="https:// or /images/..." />
      <div className="mt-2 flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? "Uploading..." : "Upload image"}
        </Button>
        {value ? <img src={value} alt="" className="h-10 w-16 rounded-lg object-cover ring-1 ring-border" /> : null}
      </div>
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}

export function SeoEntryFields({
  entry,
  onChange,
  titleLabel = "SEO title",
  descriptionLabel = "Meta description",
  keywordLabel = "Focus keyword",
  canonicalLabel = "Canonical URL",
  imageLabel = "SEO image",
}) {
  const patch = (key, value) => onChange({ ...entry, [key]: value });
  return (
    <div className="grid gap-4">
      <CountedInput label={titleLabel} value={entry.title} min={50} max={60} onChange={(value) => patch("title", value)} />
      <CountedInput label={descriptionLabel} value={entry.description} min={140} max={160} multiline onChange={(value) => patch("description", value)} />
      <Input label={keywordLabel} value={entry.keyword} onChange={(event) => patch("keyword", event.target.value)} />
      <Input label={canonicalLabel} value={entry.canonical} onChange={(event) => patch("canonical", event.target.value)} placeholder="Leave empty to use the page address" />
      <ImageField label={imageLabel} value={entry.image} onChange={(value) => patch("image", value)} />
    </div>
  );
}

export function metadataPreview(seo, { home = false, entry, path = "/" } = {}) {
  const meta = buildMetadata({ seo, entry, path, home });
  const title = typeof meta.title === "string" ? meta.title : meta.title.absolute;
  return {
    title,
    description: meta.description,
    url: meta.alternates.canonical,
    image: absoluteUrl(siteBase(seo), meta.openGraph?.images?.[0]?.url || ""),
    twitterTitle: meta.twitter.title,
    twitterDescription: meta.twitter.description,
    twitterImage: meta.twitter.images?.[0] || "",
    twitterCard: meta.twitter.card,
  };
}

export function SeoPreview({ model }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Google search</p>
        <p className="mt-3 text-lg leading-snug text-[#1a0dab]">{model.title || "Page title"}</p>
        <p className="mt-1 truncate text-sm text-[#006621]">{model.url}</p>
        <p className="mt-1 text-sm leading-6 text-neutral-600">{model.description || "Meta description"}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">Facebook</p>
        <div className="mt-3 aspect-[1.91/1] bg-neutral-100">
          {model.image ? <img src={model.image} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="bg-neutral-50 px-4 py-3">
          <p className="truncate text-xs uppercase text-neutral-500">{model.url}</p>
          <p className="mt-1 font-semibold text-neutral-900">{model.title || "Open Graph title"}</p>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{model.description || "Open Graph description"}</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Twitter · {model.twitterCard === "summary" ? "Summary" : "Summary large image"}
        </p>
        <div className={`mt-3 bg-neutral-100 ${model.twitterCard === "summary" ? "mx-4 h-24 w-24" : "aspect-[1.91/1]"}`}>
          {model.twitterImage ? <img src={model.twitterImage} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="px-4 py-3">
          <p className="font-semibold text-neutral-900">{model.twitterTitle || "Twitter title"}</p>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{model.twitterDescription || "Twitter description"}</p>
        </div>
      </div>
    </div>
  );
}
