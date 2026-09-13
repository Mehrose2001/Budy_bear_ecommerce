"use client";

import { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const emptyProduct = {
  name: "",
  slug: "",
  description: "",
  category: "boys",
  subcategory: "",
  price: "",
  salePrice: "",
  stock: 10,
  sizes: "2-3Y, 4-5Y, 6-7Y",
  colors: "Navy, Gold",
  brand: "Budy Bear",
  images: "/images/products/product-1.svg",
  featured: false,
  newArrival: true,
  bestSeller: false,
};

function toForm(product) {
  if (!product) return emptyProduct;
  return {
    ...emptyProduct,
    ...product,
    salePrice: product.salePrice ?? "",
    sizes: (product.sizes || []).join(", "),
    colors: (product.colors || []).join(", "),
    images: (product.images || []).join(", "),
  };
}

function parseList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProductForm({ product, categories, onCancel, onSave }) {
  const [form, setForm] = useState(() => toForm(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(toForm(product));
  }, [product]);

  const subcategories = useMemo(() => {
    const category = categories.find((item) => item.slug === form.category);
    return category?.subcategories || [];
  }, [categories, form.category]);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        id: product?.id,
        price: Number(form.price),
        salePrice: form.salePrice === "" ? null : Number(form.salePrice),
        stock: Number(form.stock),
        sizes: parseList(form.sizes),
        colors: parseList(form.colors),
        images: parseList(form.images),
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
        onChange={(event) => updateField("name", event.target.value)}
        required
      />
      <Input
        label="Slug"
        name="slug"
        value={form.slug}
        onChange={(event) => updateField("slug", event.target.value)}
        placeholder="auto-from-name"
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
        label="Stock"
        type="number"
        name="stock"
        min="0"
        value={form.stock}
        onChange={(event) => updateField("stock", event.target.value)}
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
      />
      <Input
        label="Colors (comma separated)"
        name="colors"
        value={form.colors}
        onChange={(event) => updateField("colors", event.target.value)}
      />
      <div className="md:col-span-2">
        <Input
          label="Image URLs (comma separated)"
          name="images"
          value={form.images}
          onChange={(event) => updateField("images", event.target.value)}
        />
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
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save product"}
        </Button>
      </div>
    </form>
  );
}
