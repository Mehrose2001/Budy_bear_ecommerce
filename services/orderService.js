import { AppError, throwIf } from "@/lib/errors";
import { mapOrder, toDbOrderStatus, toDbPaymentStatus } from "@/lib/mappers";
import { createServerClient, createUserClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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
  throwIf(rpc.error, "Unable to load order.", 500);
  return withItems(rpc.data);
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
