import { Router } from "express";
import { asyncHandler, HttpError } from "../lib/http.js";
import { optionalUser, requireUser } from "../middleware/auth.js";
import { createOrder, getOrderById, listOrdersForUser } from "../services/orders.js";

export const ordersRouter = Router();

ordersRouter.post(
  "/",
  optionalUser,
  asyncHandler(async (req, res) => {
    const order = await createOrder(req.body, req.user?.id || null);
    res.status(201).json({ order });
  })
);

ordersRouter.get(
  "/mine",
  requireUser,
  asyncHandler(async (req, res) => {
    const orders = await listOrdersForUser(req.user.id);
    res.json({ orders });
  })
);

ordersRouter.post(
  "/track",
  asyncHandler(async (req, res) => {
    const orderId = String(req.body?.orderId || req.body?.id || "").trim();
    const phone = String(req.body?.phone || "").trim();
    if (!orderId || !phone) {
      throw new HttpError(400, "Order ID and phone number are required.");
    }
    const order = await getOrderById(orderId);
    if (!order) throw new HttpError(404, "Order not found.");
    const have = String(order.customer?.phone || order.shippingAddress?.phone || "").replace(/\D/g, "");
    const want = phone.replace(/\D/g, "");
    const match =
      have &&
      want &&
      (have === want ||
        have.slice(-10) === want.slice(-10) ||
        have.endsWith(want) ||
        want.endsWith(have));
    if (!match) throw new HttpError(404, "Order not found.");
    res.json({
      order: {
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
      },
    });
  })
);

ordersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await getOrderById(req.params.id);
    if (!order) throw new HttpError(404, "Order not found");
    res.json({ order });
  })
);
