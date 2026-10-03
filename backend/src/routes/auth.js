import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import { login, register, updateAdminAccount } from "../services/auth.js";
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
