function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function phonesMatch(left, right) {
  const a = digits(left);
  const b = digits(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const short = a.length <= b.length ? a : b;
  const long = a.length <= b.length ? b : a;
  if (short.length < 10) return long.endsWith(short) && short.length >= 7;
  return long.slice(-10) === short.slice(-10);
}

export function orderPhone(order) {
  return order?.customer?.phone || order?.shippingAddress?.phone || "";
}

export function normalizeOrderStatus(status) {
  return String(status || "pending").trim().toLowerCase();
}

export function isCanceledStatus(status) {
  const key = normalizeOrderStatus(status);
  return key === "cancelled" || key === "canceled";
}

export function isDispatchStatus(status) {
  const key = normalizeOrderStatus(status);
  return ["dispatch", "processing", "shipped", "delivered"].includes(key);
}

export function getOrderTrackState(status) {
  const key = normalizeOrderStatus(status);
  const canceled = isCanceledStatus(key);
  const dispatch = isDispatchStatus(key);
  const confirmed = key === "confirmed" || dispatch;

  let current = "pending";
  if (canceled) current = "canceled";
  else if (dispatch) current = "dispatch";
  else if (confirmed) current = "confirmed";

  return {
    current,
    canceled,
    steps: [
      {
        id: "pending",
        label: "Pending",
        complete: confirmed || dispatch || canceled,
        active: current === "pending",
      },
      {
        id: "confirmed",
        label: "Confirmed",
        complete: dispatch,
        active: current === "confirmed",
        skipped: canceled && key !== "confirmed" && !dispatch,
      },
      {
        id: canceled ? "canceled" : "dispatch",
        label: canceled ? "Canceled" : "Dispatch",
        complete: dispatch && !canceled && (key === "delivered" || key === "shipped" || key === "dispatch"),
        active: current === "dispatch" || current === "canceled",
      },
    ],
  };
}

export function toPublicTrackOrder(order) {
  if (!order) return null;
  return {
    id: order.id,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    total: order.total,
    paymentMethod: order.paymentMethod,
    items: (order.items || []).map((item) => ({
      name: item.name || item.product_name || "Item",
      quantity: Number(item.quantity || 1),
      size: item.size || "",
      color: item.color || "",
    })),
  };
}
