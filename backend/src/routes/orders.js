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

ordersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await getOrderById(req.params.id);
    if (!order) throw new HttpError(404, "Order not found");
    res.json({ order });
  })
);
