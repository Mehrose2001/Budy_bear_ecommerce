import { Router } from "express";
import { config } from "../config.js";
import { asyncHandler } from "../lib/http.js";
import {
  login,
  register,
  requestPasswordReset,
  resetPasswordWithToken,
  updateAdminAccount,
} from "../services/auth.js";
import { requireAdmin, requireUser } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const result = await login(req.body?.email, req.body?.password, req.ip);
    res.json(result);
  })
);

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const result = await register(req.body || {});
    res.status(201).json(result);
  })
);

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const audience = String(req.body?.audience || "customer").toLowerCase() === "admin" ? "admin" : "customer";
    const origin = String(config.frontendOrigins[0] || "").replace(/\/$/, "");
    const redirectTo =
      String(req.body?.redirectTo || "").trim() ||
      `${origin}${audience === "admin" ? "/admin/reset-password" : "/reset-password"}`;
    const result = await requestPasswordReset(req.body?.email, redirectTo, req.ip);
    res.json(result);
  })
);

authRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const result = await resetPasswordWithToken(req.body || {});
    res.json(result);
  })
);

authRouter.get(
  "/me",
  requireUser,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

authRouter.patch(
  "/me",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await updateAdminAccount(req.user, req.body || {});
    res.json(result);
  })
);
