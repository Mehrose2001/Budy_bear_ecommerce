"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { adminUploadFile } from "@/lib/adminApi";
import { compressImageFile } from "@/lib/compressImage";
import { COLOR_SWATCHES } from "@/data/store";
import { slugify } from "@/lib/utils";
import {
  buildVariantStock,
  seedVariantStock,
  sumVariantStock,
} from "@/lib/variantStock";

const emptyProduct = {
  name: "",
  slug: "",
  description: "",
  category: "boys",
  subcategory: "",
  price: "",
  salePrice: "",
  stock: 0,
  sizes: "0-3M, 3-6M, 6-12M, 2-3Y, 4-5Y, 6-7Y",
  variantStock: {},
  brand: "Budy Bear",
  featured: false,
  newArrival: true,
  bestSeller: false,
};

function parseList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueColors(values) {
  const seen = new Set();
  return values.filter((raw) => {
    const color = String(raw || "").trim();
    const key = color.toLowerCase();
    if (!color || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toImageItems(product) {
  if (product?.colorImages?.length) {
    return product.colorImages.map((item) => ({
      id: nextId(),
      color: item.color || "",
      hex: item.hex || product.colorSwatches?.[item.color] || COLOR_SWATCHES[item.color] || "#1e3a8a",
      url: item.url,
    }));
  }

  const colors = product?.colors || ["Navy"];
  return (product?.images || ["/images/products/product-1.svg"]).map((url, index) => {
    const color = colors[index] || colors[0] || "Navy";
    return {
      id: nextId(),
      color,
      hex: product?.colorSwatches?.[color] || COLOR_SWATCHES[color] || "#1e3a8a",
      url,
    };
  });
}

function toForm(product) {
  if (!product) {
    return {
      ...emptyProduct,
      imageItems: [
        {
          id: nextId(),
          color: "Navy",
          hex: COLOR_SWATCHES.Navy,
          url: "",
        },
      ],
    };
  }

  const imageItems = toImageItems(product);
  const colors = uniqueColors(imageItems.map((item) => item.color));
  const sizes = product.sizes || [];

  return {
    ...emptyProduct,
    ...product,
    salePrice: product.salePrice ?? "",
    sizes: sizes.join(", "),
    imageItems,
    variantStock: buildVariantStock(colors, sizes, seedVariantStock(product)),
  };
}

export default function ProductForm({ product, categories, onCancel, onSave }) {
  const { admin } = useAdminAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(() => toForm(product));
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(toForm(product));
  }, [product]);

  const subcategories = useMemo(() => {
    const category = categories.find((item) => item.slug === form.category);
    return category?.subcategories || [];
  }, [categories, form.category]);

  const colorOptions = useMemo(() => {
    return uniqueColors([
      ...Object.keys(COLOR_SWATCHES),
      ...form.imageItems.map((item) => item.color),
    ]);
  }, [form.imageItems]);

  const inventoryColors = useMemo(
    () => uniqueColors(form.imageItems.map((item) => item.color)),
    [form.imageItems]
  );
  const inventorySizes = useMemo(() => parseList(form.sizes), [form.sizes]);
  const variantStock = useMemo(
    () => buildVariantStock(inventoryColors, inventorySizes, form.variantStock),
    [inventoryColors, inventorySizes, form.variantStock]
  );
  const inventoryTotal = useMemo(() => sumVariantStock(variantStock), [variantStock]);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateVariantQty = (color, size, value) => {
    setForm((current) => ({
      ...current,
      variantStock: {
        ...buildVariantStock(
          uniqueColors(current.imageItems.map((item) => item.color)),
          parseList(current.sizes),
          current.variantStock
        ),
        [color]: {
          ...buildVariantStock(
            uniqueColors(current.imageItems.map((item) => item.color)),
            parseList(current.sizes),
            current.variantStock
          )[color],
          [size]: Math.max(0, Math.floor(Number(value) || 0)),
        },
      },
    }));
  };

  const updateImageItem = (id, patch) => {
    setForm((current) => ({
      ...current,
      imageItems: current.imageItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  const addImageRow = (url = "") => {
    const color = form.imageItems[0]?.color || "Navy";
    setForm((current) => ({
      ...current,
      imageItems: [
        ...current.imageItems,
        {
          id: nextId(),
          color,
          hex: COLOR_SWATCHES[color] || "#1e3a8a",
          url,
        },
      ],
    }));
  };

  const removeImageRow = (id) => {
    setForm((current) => ({
      ...current,
      imageItems: current.imageItems.filter((item) => item.id !== id),
    }));
  };

  const uploadFiles = async (files, targetId) => {
    const list = Array.from(files || []);
    if (!list.length) return;

    setError("");
    setUploadingId(targetId || "new");

    try {
      const uploaded = [];
      for (const file of list) {
        const compressed = await compressImageFile(file);
        const data = await adminUploadFile(compressed, admin?.token, product?.id);
        uploaded.push(data.url);
      }

      setForm((current) => {
        const items = [...current.imageItems];
        const color = items[0]?.color || "Navy";
        const hex = COLOR_SWATCHES[color] || items[0]?.hex || "#1e3a8a";

        if (targetId) {
          const index = items.findIndex((item) => item.id === targetId);
          if (index >= 0) {
            items[index] = { ...items[index], url: uploaded[0] };
            uploaded.slice(1).forEach((url) => {
              items.push({ id: nextId(), color: items[index].color, hex: items[index].hex, url });
            });
            return { ...current, imageItems: items };
          }
        }

        const nextItems = items.filter((item) => item.url);
        uploaded.forEach((url) => {
          nextItems.push({ id: nextId(), color, hex, url });
        });
        return { ...current, imageItems: nextItems.length ? nextItems : items };
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingId("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const slug = slugify(form.slug);
    if (!slug) {
      setError("Slug is required so the product page can open.");
      return;
    }
    const imageItems = form.imageItems.filter((item) => item.url);
    if (!imageItems.length) {
      setError("Upload at least one product image.");
      return;
    }
    if (imageItems.some((item) => !String(item.color || "").trim())) {
      setError("Choose a color for each uploaded image.");
      return;
    }

    const colors = uniqueColors(imageItems.map((item) => item.color));
    const colorSwatches = {};
    imageItems.forEach((item) => {
      if (item.color && item.hex) colorSwatches[item.color] = item.hex;
    });

    const { imageItems: _imageItems, ...rest } = form;
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...rest,
        id: product?.id,
        slug,
        price: Number(form.price),
        salePrice: form.salePrice === "" ? null : Number(form.salePrice),
        stock: sumVariantStock(variantStock),
        sizes: parseList(form.sizes),
        variantStock,
        colors,
        images: imageItems.map((item) => item.url),
        colorImages: imageItems.map((item) => ({
          color: item.color,
          hex: item.hex,
          url: item.url,
        })),
        colorSwatches,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <Input
        label="Product name"
        name="name"
        value={form.name}
        onChange={(event) => {
          const name = event.target.value;
          setForm((current) => {
            const previousAuto = slugify(current.name);
            const next = { ...current, name };
            if (!current.slug || current.slug === previousAuto) {
              next.slug = slugify(name);
            }
            return next;
          });
        }}
        required
      />
      <Input
        label="Slug"
        name="slug"
        value={form.slug}
        onChange={(event) => updateField("slug", slugify(event.target.value))}
        placeholder="girls-floral-summer-dress"
        required
      />
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium text-neutral-700" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700" htmlFor="category">
          Category
        </label>
        <select
          id="category"
          value={form.category}
          onChange={(event) => updateField("category", event.target.value)}
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm"
        >
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700" htmlFor="subcategory">
          Subcategory
        </label>
        <select
          id="subcategory"
          value={form.subcategory}
          onChange={(event) => updateField("subcategory", event.target.value)}
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm"
        >
          <option value="">Select</option>
          {subcategories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <Input
        label="Price (PKR)"
        type="number"
        name="price"
        min="0"
        value={form.price}
        onChange={(event) => updateField("price", event.target.value)}
        required
      />
      <Input
        label="Sale price"
        type="number"
        name="salePrice"
        min="0"
        value={form.salePrice}
        onChange={(event) => updateField("salePrice", event.target.value)}
      />
      <Input
        label="Brand"
        name="brand"
        value={form.brand}
        onChange={(event) => updateField("brand", event.target.value)}
      />
      <Input
        label="Sizes (comma separated)"
        name="sizes"
        value={form.sizes}
        onChange={(event) => updateField("sizes", event.target.value)}
        placeholder="0-3M, 3-6M, 2-3Y, 4-5Y"
        className="md:col-span-2"
      />

      <div className="md:col-span-2 overflow-x-auto rounded-2xl border border-neutral-200 bg-brand-cream/40 p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-neutral-900">Color size stock</p>
            <p className="mt-1 text-xs text-neutral-500">
              Enter quantity for each size in that color. 0 means sold out for that size. If every size is 0, the color shows as sold out on the store.
            </p>
          </div>
          <p className="text-sm font-semibold text-brand-primary">Total stock: {inventoryTotal}</p>
        </div>
        {inventoryColors.length && inventorySizes.length ? (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-600">
                <th className="py-2 pr-3 font-medium">Color</th>
                {inventorySizes.map((size) => (
                  <th key={size} className="px-1 py-2 font-medium">
                    {size}
                  </th>
                ))}
                <th className="py-2 pl-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {inventoryColors.map((color) => {
                const rowTotal = inventorySizes.reduce(
                  (sum, size) => sum + Number(variantStock[color]?.[size] || 0),
                  0
                );
                return (
                  <tr key={color} className="border-b border-neutral-100">
                    <td className="py-2 pr-3 font-semibold text-brand-primary">{color}</td>
                    {inventorySizes.map((size) => (
                      <td key={size} className="px-1 py-2">
                        <input
                          type="number"
                          min="0"
                          value={variantStock[color]?.[size] ?? 0}
                          onChange={(event) => updateVariantQty(color, size, event.target.value)}
                          className="h-10 w-16 rounded-lg border border-neutral-200 px-2 text-sm"
                          aria-label={`${color} ${size} stock`}
                        />
                      </td>
                    ))}
                    <td className="py-2 pl-3 font-medium">{rowTotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-neutral-500">
            Add sizes and assign colors to images to enter stock.
          </p>
        )}
      </div>

      <div className="md:col-span-2 rounded-2xl border border-neutral-200 bg-brand-cream/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-neutral-900">Product images</p>
            <p className="mt-1 text-xs text-neutral-500">
              Browse files and assign a color to each image. Those colors appear on the product page.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              multiple
              className="sr-only"
              onChange={(event) => uploadFiles(event.target.files)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={Boolean(uploadingId)}
            >
              <Upload className="h-4 w-4" />
              {uploadingId ? "Uploading..." : "Browse images"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => addImageRow()}>
              <ImagePlus className="h-4 w-4" />
              Add row
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {form.imageItems.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-3 sm:grid-cols-[88px_minmax(0,1fr)_auto]"
            >
              <div className="relative h-20 w-full overflow-hidden rounded-xl bg-neutral-100 sm:h-20 sm:w-20">
                {item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px] text-neutral-400">
                    No image
                  </div>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-neutral-700">Color</span>
                  <input
                    list={`color-options-${item.id}`}
                    value={item.color}
                    onChange={(event) => {
                      const color = event.target.value;
                      updateImageItem(item.id, {
                        color,
                        hex: COLOR_SWATCHES[color] || item.hex,
                      });
                    }}
                    placeholder="Navy"
                    className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm"
                  />
                  <datalist id={`color-options-${item.id}`}>
                    {colorOptions.map((color) => (
                      <option key={color} value={color} />
                    ))}
                  </datalist>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-neutral-700">Swatch</span>
                  <input
                    type="color"
                    value={item.hex}
                    onChange={(event) => updateImageItem(item.id, { hex: event.target.value })}
                    className="h-11 w-full cursor-pointer rounded-xl border border-neutral-200 bg-white p-1"
                  />
                </label>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:justify-center">
                <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-brand-primary px-4 text-xs font-semibold text-brand-primary hover:bg-brand-primary hover:text-white">
                  Browse
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    className="sr-only"
                    onChange={(event) => uploadFiles(event.target.files, item.id)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeImageRow(item.id)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-error hover:bg-red-50"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 md:col-span-2">
        {[
          ["featured", "Featured"],
          ["newArrival", "New arrival"],
          ["bestSeller", "Best seller"],
        ].map(([key, label]) => (
          <label key={key} className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={Boolean(form[key])}
              onChange={(event) => updateField(key, event.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
      {error && <p className="md:col-span-2 text-sm text-error">{error}</p>}
      <div className="flex justify-end gap-3 md:col-span-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || Boolean(uploadingId)}>
          {saving ? "Saving..." : "Save product"}
        </Button>
      </div>
    </form>
  );
}
