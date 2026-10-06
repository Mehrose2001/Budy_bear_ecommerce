import { invalidateCatalogCache } from "../lib/cache.js";
import { HttpError } from "../lib/http.js";
import { mapOrder } from "../lib/map.js";
import { requireSupabase } from "../supabase.js";

const EXPRESS_CITIES = new Set(["karachi"]);

function assertOrder(body) {
  if (!body?.items?.length) throw new HttpError(400, "Your cart is empty.");
  const requiredCustomer = ["fullName", "phone"];
  if (!body.customer || requiredCustomer.some((key) => !body.customer[key]?.trim())) {
    throw new HttpError(400, "Please complete your contact details.");
  }
  const email = body.customer.email?.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Enter a valid email address.");
  }
  const requiredAddress = ["address", "city", "province"];
  if (
    !body.shippingAddress ||
    requiredAddress.some((key) => !body.shippingAddress[key]?.trim())
  ) {
    throw new HttpError(400, "Please complete your delivery address.");
  }
  if (body.paymentMethod && body.paymentMethod !== "cod") {
    throw new HttpError(400, "Please choose Cash on Delivery. Card payments are coming soon.");
  }
  if (!["standard", "express"].includes(body.deliveryMethod)) {
    throw new HttpError(400, "Please choose a delivery method.");
  }
  if (body.deliveryMethod === "express") {
    const city = String(body.shippingAddress.city || "").trim().toLowerCase();
    const province = String(body.shippingAddress.province || "").trim().toLowerCase();
    if (province !== "sindh" || !EXPRESS_CITIES.has(city)) {
      throw new HttpError(400, "Express delivery is available only in Karachi, Sindh.");
    }
  }
}

export async function createOrder(body, userId = null) {
  assertOrder(body);
  const supabase = await requireSupabase();

  const payload = {
    items: body.items,
    subtotal: Number(body.subtotal),
    discount: Number(body.discount || 0),
    shipping: Number(body.shipping || 0),
    total: Number(body.total),
    deliveryMethod: body.deliveryMethod,
    paymentMethod: body.paymentMethod || "cod",
    shippingAddress: body.shippingAddress,
    customer: body.customer,
    notes: body.notes || "",
    couponCode: body.couponCode || "",
    userId: userId || body.userId || "",
  };

  const { data, error } = await supabase.rpc("place_order", { payload });
  if (error) {
    throw new HttpError(error.message.includes("stock") ? 409 : 400, error.message);
  }
  invalidateCatalogCache();
  return mapOrder(data);
}

export async function getOrderById(id) {
  const supabase = await requireSupabase();
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw new HttpError(500, "Unable to load order.");
  return mapOrder(data);
}

export async function listOrders() {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(500, "Unable to load orders.");
  return (data || []).map(mapOrder);
}

export async function listOrdersForUser(userId) {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(500, "Unable to load orders.");
  return (data || []).map(mapOrder);
}

export async function updateOrderStatus(id, orderStatus) {
  const order = await getOrderById(id);
  if (!order) throw new HttpError(404, "Order not found");

  const patch = { order_status: orderStatus };
  if (orderStatus === "Cancelled") {
    patch.payment_status = order.paymentMethod === "cod" ? "Unpaid" : "Refunded";
  }
  if (orderStatus === "Delivered" && order.paymentMethod === "cod") {
    patch.payment_status = "Paid";
  }

  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new HttpError(400, error.message);
  return mapOrder(data);
}

export function listCustomersFromOrders(orders) {
  const map = new Map();
  orders.forEach((order) => {
    const email = order.customer?.email;
    if (!email) return;
    const current = map.get(email) || {
      email,
      name: order.customer.fullName,
      phone: order.customer.phone,
      orders: 0,
      spent: 0,
    };
    current.orders += 1;
    if (order.orderStatus !== "Cancelled") current.spent += order.total;
    map.set(email, current);
  });
  return Array.from(map.values());
}
