import { EXPRESS_SHIPPING_FEE, FREE_DELIVERY_THRESHOLD, SHIPPING_FEE } from "@/data/store";

const globalStore = globalThis.__budyBearOrders ?? {
  orders: new Map(),
  counter: 1001,
};

globalThis.__budyBearOrders = globalStore;

function getStore() {
  return globalThis.__budyBearOrders;
}

export function getShippingCost(discountedSubtotal, deliveryMethod = "standard") {
  if (deliveryMethod === "express") {
    return EXPRESS_SHIPPING_FEE;
  }

  if (discountedSubtotal === 0 || discountedSubtotal >= FREE_DELIVERY_THRESHOLD) {
    return 0;
  }

  return SHIPPING_FEE;
}

export function createOrder(payload) {
  const store = getStore();
  const id = `BB-${store.counter++}`;
  const paymentMethod = payload.paymentMethod || "cod";
  const isCod = paymentMethod === "cod";

  const order = {
    id,
    userId: payload.userId || null,
    items: payload.items,
    subtotal: payload.subtotal,
    discount: payload.discount,
    shipping: payload.shipping,
    total: payload.total,
    deliveryMethod: payload.deliveryMethod,
    paymentMethod,
    paymentStatus: isCod ? "Unpaid" : "Pending",
    orderStatus: "Pending",
    shippingAddress: payload.shippingAddress,
    customer: payload.customer,
    notes: payload.notes || "",
    createdAt: new Date().toISOString(),
  };

  store.orders.set(id, order);
  return order;
}

export function getOrderById(id) {
  return getStore().orders.get(id) || null;
}

export function updateOrderStatus(id, orderStatus) {
  const order = getStore().orders.get(id);
  if (!order) return null;
  order.orderStatus = orderStatus;
  if (orderStatus === "Cancelled") {
    order.paymentStatus = order.paymentMethod === "cod" ? "Unpaid" : "Refunded";
  }
  if (orderStatus === "Delivered" && order.paymentMethod === "cod") {
    order.paymentStatus = "Paid";
  }
  return order;
}

export function listOrders() {
  return Array.from(getStore().orders.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}
