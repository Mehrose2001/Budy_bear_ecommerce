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
    orderStatus: isCod ? "Confirmed" : "Pending",
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

function seedDemoOrders() {
  const store = getStore();
  if (store.orders.size) return;

  const samples = [
    {
      items: [
        {
          id: "1-4-5Y-Blue",
          productId: 1,
          slug: "kids-cotton-graphic-t-shirt",
          name: "Kids Cotton Graphic T-Shirt",
          image: "/images/products/product-1.svg",
          unitPrice: 1199,
          quantity: 2,
          color: "Blue",
          size: "4-5Y",
        },
      ],
      subtotal: 2998,
      discount: 600,
      shipping: 0,
      total: 2398,
      deliveryMethod: "standard",
      paymentMethod: "cod",
      customer: {
        fullName: "Hassan Raza",
        email: "hassan@example.com",
        phone: "03014567890",
      },
      shippingAddress: {
        fullName: "Hassan Raza",
        address: "12 Gulberg",
        city: "Lahore",
        province: "Punjab",
        postalCode: "54000",
        phone: "03014567890",
      },
    },
    {
      items: [
        {
          id: "7-6-7Y-Pink",
          productId: 7,
          slug: "girls-floral-summer-dress",
          name: "Girls Floral Summer Dress",
          image: "/images/products/product-7.svg",
          unitPrice: 2299,
          quantity: 1,
          color: "Pink",
          size: "6-7Y",
        },
      ],
      subtotal: 2799,
      discount: 500,
      shipping: 249,
      total: 2548,
      deliveryMethod: "standard",
      paymentMethod: "bank-transfer",
      customer: {
        fullName: "Sara Ahmed",
        email: "sara@example.com",
        phone: "03211234567",
      },
      shippingAddress: {
        fullName: "Sara Ahmed",
        address: "45 Clifton",
        city: "Karachi",
        province: "Sindh",
        postalCode: "75600",
        phone: "03211234567",
      },
    },
  ];

  samples.forEach((sample) => createOrder(sample));
}

export function listOrders() {
  seedDemoOrders();
  return Array.from(getStore().orders.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}
