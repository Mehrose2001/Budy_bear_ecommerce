import {
  hasVariantStock,
  normalizeVariantStock,
  sumVariantStock,
} from "@/lib/variantStock";
import { slugify } from "@/lib/utils";
import { normalizeSeasonalCollection } from "@/lib/seasonalCollection";

function numberOrNull(value) {
  if (value === "" || value == null) return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function colorsFromImages(row) {
  const seen = new Set();
  const fromImages = (row.color_images || row.colorImages || [])
    .map((item) => String(item?.color || "").trim())
    .filter(Boolean)
    .filter((color) => {
      const key = color.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (fromImages.length) return fromImages;
  return row.colors || [];
}

function titleCaseStatus(value, fallback) {
  if (!value) return fallback;
  if (value === "Unpaid" || value === "Paid") return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function mapProduct(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    category: row.category_id || row.category,
    subcategory: row.subcategory || "",
    price: Number(row.price),
    salePrice: (() => {
      const listed = Number(row.price);
      const sale = numberOrNull(row.sale_price ?? row.salePrice);
      const compare = numberOrNull(row.compare_at_price);
      if (sale != null && sale < listed) return sale;
      if (compare != null && compare < listed) return compare;
      return sale;
    })(),
    sku: row.sku || "",
    images: row.images || [],
    colorImages: row.color_images || [],
    colorSwatches: row.color_swatches || {},
    sizes: row.sizes || [],
    colors: colorsFromImages(row),
    variantStock: normalizeVariantStock(row.variant_stock || row.variantStock),
    stock: hasVariantStock({ variantStock: row.variant_stock || row.variantStock })
      ? sumVariantStock(row.variant_stock || row.variantStock)
      : Number(row.stock_quantity ?? row.stock ?? 0),
    rating: Number(row.rating || 0),
    reviewCount: Number(row.review_count || 0),
    brand: row.brand || "Budy Bear",
    featured: Boolean(row.is_featured ?? row.featured),
    newArrival: Boolean(row.new_arrival),
    bestSeller: Boolean(row.best_seller),
    isActive: row.is_active !== false,
  };
}

export function productToRow(input, existing = {}) {
  const salePrice =
    input.salePrice === "" || input.salePrice == null
      ? input.compare_at_price ?? existing.compare_at_price ?? existing.sale_price ?? null
      : Number(input.salePrice);

  const variantStock = normalizeVariantStock(
    input.variantStock ?? input.variant_stock ?? existing.variantStock ?? existing.variant_stock
  );
  const hasVariants = Object.keys(variantStock).length > 0;
  const totalStock = hasVariants
    ? sumVariantStock(variantStock)
    : Number(input.stock ?? input.stock_quantity ?? existing.stock ?? 0);

  return {
    name: input.name ?? existing.name,
    slug: slugify(input.slug ?? existing.slug ?? ""),
    description: input.description ?? existing.description ?? "",
    category_id: input.category ?? input.category_id ?? existing.category_id,
    subcategory: input.subcategory ?? existing.subcategory ?? "",
    price: Number(input.price ?? existing.price ?? 0),
    sale_price: salePrice,
    compare_at_price: salePrice,
    sku: input.sku ?? existing.sku ?? null,
    images: input.images ?? existing.images ?? [],
    color_images: input.colorImages ?? input.color_images ?? existing.color_images ?? [],
    color_swatches:
      input.colorSwatches ?? input.color_swatches ?? existing.color_swatches ?? {},
    sizes: input.sizes ?? existing.sizes ?? ["One Size"],
    variant_stock: variantStock,
    colors:
      input.colors?.length
        ? input.colors
        : colorsFromImages({
            color_images: input.colorImages ?? input.color_images ?? existing.color_images,
            colors: existing.colors,
          }),
    stock: totalStock,
    stock_quantity: totalStock,
    rating: Number(input.rating ?? existing.rating ?? 5),
    review_count: Number(input.reviewCount ?? input.review_count ?? existing.review_count ?? 0),
    brand: input.brand ?? existing.brand ?? "Budy Bear",
    featured: Boolean(input.featured ?? input.is_featured ?? existing.featured),
    is_featured: Boolean(input.featured ?? input.is_featured ?? existing.is_featured ?? existing.featured),
    is_active: input.isActive ?? input.is_active ?? existing.is_active ?? true,
    new_arrival: Boolean(input.newArrival ?? input.new_arrival ?? existing.new_arrival),
    best_seller: Boolean(input.bestSeller ?? input.best_seller ?? existing.best_seller),
  };
}

export function mapCategory(row) {
  if (!row) return null;
  const subcategories = Array.isArray(row.subcategories)
    ? row.subcategories
    : typeof row.subcategories === "string"
      ? row.subcategories.split(",").map((item) => item.trim()).filter(Boolean)
      : [];
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    image: row.image_url || row.image,
    imageUrl: row.image_url || row.image,
    subcategories,
    isActive: row.is_active !== false,
  };
}

export function mapCoupon(row) {
  if (!row) return null;
  const percent = Number(row.discount_percent ?? row.discountPercent ?? row.percent ?? 0);
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    discountPercent: Number.isFinite(percent) ? percent : 0,
    minOrder: Number(row.min_order ?? row.minOrder ?? 0),
    active: Boolean(row.active),
  };
}

export function mapBanner(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    image: row.image || row.image_url,
    href: row.href,
    active: Boolean(row.active),
  };
}

export function mapSettings(row) {
  if (!row) {
    return {
      storeName: "Budy Bear",
      announcement: "Free Delivery on Orders Above Rs. 3,000",
      supportEmail: "budybear2026@gmail.com",
      supportPhone: "+92 333 0370236",
      seasonalCollection: "winter",
    };
  }
  return {
    storeName: row.store_name,
    announcement: row.announcement,
    supportEmail: row.support_email,
    supportPhone: row.support_phone,
    seasonalCollection: normalizeSeasonalCollection(
      row.seasonal_collection || row.seasonalCollection
    ),
  };
}

export function mapReview(row) {
  if (!row) return null;
  const testimonial =
    row.is_testimonial === true ||
    row.status === "Testimonial" ||
    /\[\[bb-testimonial\]\]/.test(String(row.comment || ""));
  const approved =
    testimonial ||
    row.is_approved === true ||
    row.status === "Published";
  const comment = String(row.comment || "")
    .replace(/\s*\[\[bb-testimonial\]\]\s*/g, "")
    .trim();
  return {
    id: row.id,
    productId: Number(row.product_id),
    productName: row.product_name,
    author: row.customer_name || row.author,
    customerName: row.customer_name || row.author,
    rating: Number(row.rating),
    title: row.title,
    comment,
    status: testimonial ? "Testimonial" : row.status || (approved ? "Published" : "Pending"),
    isApproved: approved,
    isTestimonial: testimonial,
    date: row.created_at?.slice?.(0, 10) || row.created_at,
  };
}

export function mapOrder(row, items = null) {
  if (!row) return null;
  const lineItems = items || row.items || [];
  return {
    id: row.id,
    userId: row.user_id,
    items: lineItems,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount || 0),
    shipping: Number(row.shipping_fee ?? row.shipping ?? 0),
    total: Number(row.total_amount ?? row.total),
    deliveryMethod: row.delivery_method,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status === "pending" ? "Unpaid" : titleCaseStatus(row.payment_status, "Unpaid"),
    orderStatus: titleCaseStatus(row.order_status, "Pending"),
    shippingAddress: row.shipping_address,
    customer: row.customer || {
      fullName: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
    },
    notes: row.notes || "",
    couponCode: row.coupon_code || "",
    createdAt: row.created_at,
  };
}

export function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.full_name,
    phone: row.phone,
    address: row.address || "",
    city: row.city || "",
    role: row.role,
  };
}

export function toDbOrderStatus(status) {
  return String(status || "pending").trim().toLowerCase();
}

export function toDbPaymentStatus(status) {
  const value = String(status || "pending").trim().toLowerCase();
  if (value === "unpaid") return "pending";
  return value;
}
