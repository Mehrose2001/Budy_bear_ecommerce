"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { adminUploadFile } from "@/lib/adminApi";
import { emptyCategoryBanner } from "@/lib/categoryBanner";

function ImagePreview({ url }) {
  if (!url) return null;
  return (
    <span className="relative block h-32 w-full overflow-hidden rounded-xl bg-brand-cream ring-1 ring-border">
      <Image src={url} alt="" fill className="object-cover" sizes="320px" />
    </span>
  );
}

export default function CategoryBannerFields({ form, setForm, adminToken, slugHint, subcategorySlug = "" }) {
  const [uploading, setUploading] = useState("");
  const rawBanner = subcategorySlug
    ? form.subcategoryBanners?.[subcategorySlug]
    : form.banner;
  const banner = { ...emptyCategoryBanner(), ...(rawBanner && typeof rawBanner === "object" ? rawBanner : {}) };
  const label = subcategorySlug ? `Subcategory banner (${subcategorySlug})` : "Category page banner";

  const patch = (updates) => {
    const next = { ...banner, ...updates, mediaType: "image" };
    if (subcategorySlug) {
      setForm({
        ...form,
        subcategoryBanners: {
          ...(form.subcategoryBanners || {}),
          [subcategorySlug]: next,
        },
      });
      return;
    }
    setForm({ ...form, banner: next });
  };

  const upload = async (file, field, folder) => {
    if (!file || !adminToken) return;
    setUploading(field);
    try {
      const data = await adminUploadFile(file, adminToken, slugHint || "category", folder);
      patch({ [field]: data.url });
    } finally {
      setUploading("");
    }
  };

  return (
    <div className="md:col-span-2 rounded-2xl border border-border bg-neutral-50 p-4">
      <h4 className="text-base font-black text-brand-primary">{label}</h4>
      <p className="mt-1 text-xs text-neutral-500">
        Shown at the top of the category listing. Upload desktop and optional mobile images.
      </p>

      <label className="mt-4 inline-flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={Boolean(banner.enabled)}
          onChange={(event) => patch({ enabled: event.target.checked })}
        />
        Enable banner on storefront
      </label>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Input
          label="Heading"
          value={banner.heading || ""}
          onChange={(event) => patch({ heading: event.target.value })}
        />
        <Input
          label="CTA label"
          value={banner.ctaLabel || ""}
          onChange={(event) => patch({ ctaLabel: event.target.value })}
        />
        <Input
          label="CTA link"
          className="md:col-span-2"
          value={banner.ctaHref || ""}
          onChange={(event) => patch({ ctaHref: event.target.value })}
        />
        <Input
          label="Description"
          className="md:col-span-2"
          value={banner.description || ""}
          onChange={(event) => patch({ description: event.target.value })}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <p className="text-sm font-medium text-neutral-800 sm:col-span-2">Desktop image</p>
        <ImagePreview url={banner.image} />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-primary">
          <ImagePlus className="h-4 w-4" />
          {uploading === "image" ? "Uploading..." : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => upload(event.target.files?.[0], "image", "category-banners")}
          />
        </label>

        <p className="text-sm font-medium text-neutral-800 sm:col-span-2">Mobile image (optional)</p>
        <ImagePreview url={banner.imageMobile} />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-primary">
          <ImagePlus className="h-4 w-4" />
          {uploading === "imageMobile" ? "Uploading..." : "Upload mobile image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) =>
              upload(event.target.files?.[0], "imageMobile", "category-banners")
            }
          />
        </label>
      </div>

      {(banner.image || banner.imageMobile) && (
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() =>
            patch({
              image: "",
              imageMobile: "",
            })
          }
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear images
        </Button>
      )}
    </div>
  );
}
