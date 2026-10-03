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
    salePrice: row.compare_at_price == null && row.sale_price == null ? null : Number(row.compare_at_price ?? row.sale_price),
    images: row.images || [],
    colorImages: row.color_images || [],
    colorSwatches: row.color_swatches || {},
    sizes: row.sizes || [],
    colors: colorsFromImages(row),
    stock: Number(row.stock_quantity ?? row.stock ?? 0),
    rating: Number(row.rating || 0),
    reviewCount: Number(row.review_count || 0),
    brand: row.brand || "Budy Bear",
    featured: Boolean(row.is_featured ?? row.featured),
    isActive: row.is_active !== false,
    newArrival: Boolean(row.new_arrival),
    bestSeller: Boolean(row.best_seller),
  };
}

export function productToRow(input, existing = {}) {
  return {
    name: input.name ?? existing.name,
    slug: input.slug ?? existing.slug,
    description: input.description ?? existing.description ?? "",
    category_id: input.category ?? input.category_id ?? existing.category_id,
    subcategory: input.subcategory ?? existing.subcategory ?? "",
    price: Number(input.price ?? existing.price ?? 0),
    sale_price:
      input.salePrice === "" || input.salePrice == null
        ? input.sale_price ?? existing.sale_price ?? null
        : Number(input.salePrice),
    compare_at_price:
      input.salePrice === "" || input.salePrice == null
        ? input.compare_at_price ?? existing.compare_at_price ?? existing.sale_price ?? null
        : Number(input.salePrice),
    sku: input.sku ?? existing.sku ?? null,
    images: input.images ?? existing.images ?? [],
    color_images: input.colorImages ?? input.color_images ?? existing.color_images ?? [],
    color_swatches:
      input.colorSwatches ?? input.color_swatches ?? existing.color_swatches ?? {},
    sizes: input.sizes ?? existing.sizes ?? ["One Size"],
    colors:
      input.colors?.length
        ? input.colors
        : colorsFromImages({
            color_images: input.colorImages ?? input.color_images ?? existing.color_images,
            colors: existing.colors,
          }),
    stock: Number(input.stock ?? existing.stock ?? 0),
    stock_quantity: Number(input.stock ?? input.stock_quantity ?? existing.stock_quantity ?? existing.stock ?? 0),
    rating: Number(input.rating ?? existing.rating ?? 5),
    review_count: Number(input.reviewCount ?? input.review_count ?? existing.review_count ?? 0),
    brand: input.brand ?? existing.brand ?? "Budy Bear",
    featured: Boolean(input.featured ?? existing.featured),
    is_featured: Boolean(input.featured ?? input.is_featured ?? existing.is_featured ?? existing.featured),
    is_active: input.isActive ?? input.is_active ?? existing.is_active ?? true,
    new_arrival: Boolean(input.newArrival ?? input.new_arrival ?? existing.new_arrival),
    best_seller: Boolean(input.bestSeller ?? input.best_seller ?? existing.best_seller),
  };
}

export function mapCategory(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    image: row.image_url || row.image,
    subcategories: row.subcategories || [],
  };
}

export function mapCoupon(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    discountPercent: Number(row.discount_percent),
    minOrder: Number(row.min_order),
    active: Boolean(row.active),
  };
}

export function mapBanner(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    image: row.image,
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
    };
  }
  return {
    storeName: row.store_name,
    announcement: row.announcement,
    supportEmail: row.support_email,
    supportPhone: row.support_phone,
  };
}

export function mapReview(row) {
  if (!row) return null;
  return {
    id: row.id,
    productId: Number(row.product_id),
    productName: row.product_name,
    author: row.customer_name || row.author,
    rating: Number(row.rating),
    title: row.title,
    comment: row.comment,
    status: row.is_testimonial || row.status === "Testimonial" ? "Testimonial" : row.status || (row.is_approved ? "Published" : "Pending"),
    date: row.created_at?.slice?.(0, 10) || row.created_at,
  };
}

export function mapOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    items: row.items,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    shipping: Number(row.shipping),
    total: Number(row.total),
    deliveryMethod: row.delivery_method,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    shippingAddress: row.shipping_address,
    customer: row.customer,
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
    role: row.role,
  };
}
