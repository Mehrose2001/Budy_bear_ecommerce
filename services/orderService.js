import { invalidateCatalogSnapshot } from "@/lib/catalog";
import { AppError, throwIf } from "@/lib/errors";
import { mapOrder, toDbOrderStatus, toDbPaymentStatus } from "@/lib/mappers";
import { createServerClient, createServiceClient, createUserClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { orderPhone, phonesMatch, toPublicTrackOrder } from "@/lib/orderTracking";

function client(accessToken) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase is not configured.", 503);
  }
  return accessToken ? createUserClient(accessToken) : createServerClient();
}

function withItems(orderRow) {
  if (!orderRow) return null;
  const fallbackItems = (orderRow.order_items || []).map((item) => ({
    productId: item.product_id,
    name: item.product_name,
    unitPrice: Number(item.product_price),
    quantity: Number(item.quantity),
  }));
  return mapOrder(orderRow, orderRow.items?.length ? orderRow.items : fallbackItems);
}

export async function createOrder(orderData, orderItems, accessToken) {
  const supabase = client(accessToken);
  const items = orderItems || orderData.items || [];
  const { data, error } = await supabase.rpc("place_order", {
    payload: {
      items,
      subtotal: Number(orderData.subtotal),
      discount: Number(orderData.discount || 0),
      shipping: Number(orderData.shipping || 0),
      total: Number(orderData.total),
      deliveryMethod: orderData.deliveryMethod,
      paymentMethod: orderData.paymentMethod || "cod",
      shippingAddress: orderData.shippingAddress,
      customer: orderData.customer,
      notes: orderData.notes || "",
      couponCode: orderData.couponCode || "",
      userId: orderData.userId || "",
    },
  });
  throwIf(error, error?.message || "Unable to create this order.", error?.message?.includes("stock") ? 409 : 400);
  return withItems(data);
}

export async function getOrderById(id, accessToken) {
  const supabase = client(accessToken);
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (!error && data) return withItems(data);

  const rpc = await supabase.rpc("get_order", { p_id: id });
  if (rpc.error || !rpc.data) return null;
  return withItems(rpc.data);
}

export async function trackOrder(orderId, phone) {
  const id = String(orderId || "").trim();
  const supabase = createServiceClient() || client();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();

  let order = !error && data ? withItems(data) : null;
  if (!order) {
    const rpc = await supabase.rpc("get_order", { p_id: id });
    if (rpc.data) order = withItems(rpc.data);
  }

  if (!order || !phonesMatch(orderPhone(order), phone)) {
    throw new AppError("Order not found.", 404);
  }
  return toPublicTrackOrder(order);
}

export async function getUserOrders(userId, accessToken) {
  const supabase = client(accessToken);
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  throwIf(error, "Unable to load orders.", 500);
  return (data || []).map(withItems);
}

export async function getAllOrders(accessToken) {
  const supabase = client(accessToken);
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  throwIf(error, "Unable to load orders.", 500);
  return (data || []).map(withItems);
}

export async function updateOrderStatus(id, status, accessToken) {
  const order = await getOrderById(id, accessToken);
  if (!order) throw new AppError("Order not found", 404);
  const orderStatus = toDbOrderStatus(status);
  const patch = { order_status: orderStatus };
  if (orderStatus === "cancelled") {
    patch.payment_status = order.paymentMethod === "cod" ? "pending" : "refunded";
  }
  if (orderStatus === "delivered" && order.paymentMethod === "cod") {
    patch.payment_status = "paid";
  }
  const supabase = client(accessToken);
  const { data, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  throwIf(error, "Unable to update order.");
  return withItems({ ...data, items: data.items?.length ? data.items : order.items });
}

function cloneVariants(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return JSON.parse(JSON.stringify(value));
}

function sumVariants(variants) {
  return Object.values(variants).reduce((total, sizes) => {
    if (!sizes || typeof sizes !== "object") return total;
    return total + Object.values(sizes).reduce((sum, qty) => sum + Number(qty || 0), 0);
  }, 0);
}

async function restoreOrderStock(supabase, items) {
  for (const item of items || []) {
    const productId = item.productId || item.product_id;
    const qty = Math.max(1, Number(item.quantity) || 1);
    if (!productId) continue;

    const { data: product, error } = await supabase
      .from("products")
      .select("id, variant_stock, stock_quantity, stock")
      .eq("id", productId)
      .maybeSingle();
    if (error || !product) continue;

    const variants = cloneVariants(product.variant_stock);
    const color = String(item.color || "").trim();
    const size = String(item.size || "").trim();
    const hasVariants = Object.keys(variants).length > 0;

    if (hasVariants && color) {
      const colorKey = Object.keys(variants).find((key) => key.toLowerCase() === color.toLowerCase());
      const sizes = colorKey ? { ...variants[colorKey] } : null;
      const sizeKey = sizes
        ? Object.keys(sizes).find((key) => key.toLowerCase() === size.toLowerCase())
        : "";
      if (!colorKey || !sizeKey) continue;
      sizes[sizeKey] = Number(sizes[sizeKey] || 0) + qty;
      variants[colorKey] = sizes;
      const total = sumVariants(variants);
      const { error: updateError } = await supabase
        .from("products")
        .update({ variant_stock: variants, stock_quantity: total, stock: total })
        .eq("id", productId);
      throwIf(updateError, "Unable to restore product stock.");
      continue;
    }

    if (hasVariants) continue;

    const next = Number(product.stock_quantity ?? product.stock ?? 0) + qty;
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: next, stock: next })
      .eq("id", productId);
    throwIf(updateError, "Unable to restore product stock.");
  }
}

export async function deleteOrder(id, accessToken) {
  const supabase = createServiceClient() || client(accessToken);
  const order = await getOrderById(id, accessToken);
  if (!order) throw new AppError("Order not found", 404);
  await restoreOrderStock(supabase, order.items);
  const { error } = await supabase.from("orders").delete().eq("id", id);
  throwIf(error, "Unable to delete order.");
  invalidateCatalogSnapshot();
  return true;
}

export async function updatePaymentStatus(id, status, accessToken) {
  const supabase = client(accessToken);
  const { data, error } = await supabase
    .from("orders")
    .update({ payment_status: toDbPaymentStatus(status) })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  throwIf(error, "Unable to update payment.");
  if (!data) throw new AppError("Order not found", 404);
  return withItems(data);
}
