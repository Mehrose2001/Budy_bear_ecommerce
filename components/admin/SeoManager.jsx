"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { CountedInput, ImageField, metadataPreview, SeoEntryFields, SeoPreview } from "@/components/admin/SeoFields";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminFetch } from "@/lib/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  duplicateTitleWarnings,
  emptySeo,
  lengthWarning,
  normalizeSeo,
  ROBOTS_OPTIONS,
  SEO_PAGES,
  TWITTER_CARDS,
} from "@/data/seo";

const TABS = [
  ["general", "General SEO"],
  ["home", "Homepage SEO"],
  ["social", "Social Media SEO"],
  ["pages", "Pages"],
];

export default function SeoManager() {
  const { admin } = useAdminAuth();
  const [seo, setSeo] = useState(emptySeo());
  const [tab, setTab] = useState("general");
  const [pageKey, setPageKey] = useState(SEO_PAGES[0].key);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!admin?.token) return;
    adminFetch("/api/admin/content?resource=seo", {}, admin.token)
      .then((data) => setSeo(normalizeSeo(data.seo)))
      .catch((loadError) => setError(loadError.message || "Unable to load SEO settings."))
      .finally(() => setLoading(false));
  }, [admin?.token]);

  const patch = (next) => setSeo((current) => normalizeSeo({ ...current, ...next, entities: current.entities }));
  const page = SEO_PAGES.find((item) => item.key === pageKey) || SEO_PAGES[0];

  const warnings = useMemo(() => {
    const items = [
      lengthWarning("Website SEO title", seo.title, 50, 60),
      lengthWarning("Website meta description", seo.description, 140, 160),
      lengthWarning("Homepage SEO title", seo.home.title, 50, 60),
      lengthWarning("Homepage meta description", seo.home.description, 140, 160),
      ...SEO_PAGES.flatMap((item) => [
        lengthWarning(`${item.label} title`, seo.pages[item.key]?.title, 50, 60),
        lengthWarning(`${item.label} description`, seo.pages[item.key]?.description, 140, 160),
      ]),
    ].filter(Boolean);
    return [
      ...items,
      ...duplicateTitleWarnings([
        { label: "Website SEO title", title: seo.title },
        { label: "Homepage SEO title", title: seo.home.title },
        ...SEO_PAGES.map((item) => ({ label: item.label, title: seo.pages[item.key]?.title })),
      ]),
    ];
  }, [seo]);

  const preview = useMemo(() => {
    if (tab === "social") {
      const home = metadataPreview(seo, { home: true, entry: seo.home, path: "/" });
      return {
        ...home,
        title: seo.social.ogTitle || home.title,
        description: seo.social.ogDescription || home.description,
        image: seo.social.ogImage || home.image,
        twitterTitle: seo.social.twitterTitle || seo.social.ogTitle || home.title,
        twitterDescription: seo.social.twitterDescription || seo.social.ogDescription || home.description,
        twitterImage: seo.social.twitterImage || seo.social.ogImage || home.image,
        twitterCard: seo.social.twitterCard,
      };
    }
    if (tab === "pages") {
      return metadataPreview(seo, { entry: seo.pages[page.key], path: page.path });
    }
    if (tab === "home") return metadataPreview(seo, { home: true, entry: seo.home, path: "/" });
    return metadataPreview(seo, { home: true, path: "/" });
  }, [seo, tab, page]);

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await adminFetch(
        "/api/admin/content",
        { method: "POST", body: JSON.stringify({ resource: "seo", data: seo }) },
        admin.token
      );
      setSeo(normalizeSeo(data.settings?.seo || seo));
      setMessage("SEO settings saved.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save SEO settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <AdminPageHeader
        title="SEO settings"
        description="Update search and social metadata. Empty fields keep the current page title, description, or image."
        action={
          <Button type="button" onClick={save} disabled={saving || loading}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        }
      />
      {message ? <p className="mb-4 text-sm font-medium text-green-700">{message}</p> : null}
      {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}
      {warnings.length ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {warnings.slice(0, 6).map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
          {warnings.length > 6 ? <p>{warnings.length - 6} more recommendations.</p> : null}
        </div>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === id ? "bg-brand-primary text-white" : "bg-white text-neutral-700 ring-1 ring-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          {loading ? <p className="text-sm text-neutral-500">Loading SEO settings...</p> : null}
          {!loading && tab === "general" ? (
            <div className="grid gap-4">
              <CountedInput label="Website SEO title" value={seo.title} min={50} max={60} onChange={(title) => patch({ title })} />
              <CountedInput label="Website meta description" value={seo.description} min={140} max={160} multiline onChange={(description) => patch({ description })} />
              <Input label="Website focus keywords" value={seo.keywords} onChange={(event) => patch({ keywords: event.target.value })} placeholder="kids wear, children clothing" />
              <ImageField label="Website logo" value={seo.logo} onChange={(logo) => patch({ logo })} />
              <ImageField label="Default SEO image" value={seo.image} onChange={(image) => patch({ image })} />
              <Input label="Website canonical base URL" value={seo.canonicalBase} onChange={(event) => patch({ canonicalBase: event.target.value })} placeholder="https://budybear.com" />
              <label className="block text-sm font-medium text-neutral-700">
                Default robots directive
                <select
                  value={seo.robots}
                  onChange={(event) => patch({ robots: event.target.value })}
                  className="mt-2 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm"
                >
                  {ROBOTS_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {!loading && tab === "home" ? (
            <SeoEntryFields
              entry={seo.home}
              onChange={(home) => patch({ home })}
              titleLabel="Homepage SEO title"
              descriptionLabel="Homepage meta description"
              keywordLabel="Homepage focus keyword"
              canonicalLabel="Homepage canonical URL"
              imageLabel="Homepage SEO image"
            />
          ) : null}
          {!loading && tab === "social" ? (
            <div className="grid gap-4">
              <Input label="Open Graph title" value={seo.social.ogTitle} onChange={(event) => patch({ social: { ...seo.social, ogTitle: event.target.value } })} />
              <CountedInput label="Open Graph description" value={seo.social.ogDescription} min={140} max={160} multiline onChange={(ogDescription) => patch({ social: { ...seo.social, ogDescription } })} />
              <ImageField label="Open Graph image" value={seo.social.ogImage} onChange={(ogImage) => patch({ social: { ...seo.social, ogImage } })} />
              <Input label="Twitter card title" value={seo.social.twitterTitle} onChange={(event) => patch({ social: { ...seo.social, twitterTitle: event.target.value } })} />
              <CountedInput label="Twitter card description" value={seo.social.twitterDescription} min={140} max={160} multiline onChange={(twitterDescription) => patch({ social: { ...seo.social, twitterDescription } })} />
              <ImageField label="Twitter card image" value={seo.social.twitterImage} onChange={(twitterImage) => patch({ social: { ...seo.social, twitterImage } })} />
              <label className="block text-sm font-medium text-neutral-700">
                Twitter card type
                <select
                  value={seo.social.twitterCard}
                  onChange={(event) => patch({ social: { ...seo.social, twitterCard: event.target.value } })}
                  className="mt-2 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm"
                >
                  {TWITTER_CARDS.map((option) => (
                    <option key={option} value={option}>{option === "summary" ? "Summary" : "Summary large image"}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {!loading && tab === "pages" ? (
            <div className="grid gap-4">
              <label className="block text-sm font-medium text-neutral-700">
                Page
                <select
                  value={pageKey}
                  onChange={(event) => setPageKey(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm"
                >
                  {SEO_PAGES.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </label>
              <SeoEntryFields
                entry={seo.pages[page.key]}
                onChange={(entry) => patch({ pages: { ...seo.pages, [page.key]: entry } })}
                titleLabel={`${page.label} SEO title`}
                descriptionLabel={`${page.label} meta description`}
                keywordLabel="Focus keyword"
                canonicalLabel="Canonical URL"
                imageLabel="SEO image"
              />
            </div>
          ) : null}
        </div>
        <SeoPreview model={preview} />
      </div>
    </div>
  );
}
