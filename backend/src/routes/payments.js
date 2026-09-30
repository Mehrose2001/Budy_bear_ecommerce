import { Router } from "express";

export const paymentsRouter = Router();

paymentsRouter.all("/", (_req, res) => {
  res.status(501).json({
    available: false,
    error: "Payment gateway is not configured yet.",
  });
});
