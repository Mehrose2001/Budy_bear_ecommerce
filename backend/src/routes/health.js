import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import { isFtpConfigured, isSupabaseConfigured } from "../config.js";
import { getSnapshot } from "../services/catalog.js";

export const healthRouter = Router();

healthRouter.get("/", asyncHandler(async (_req, res) => {
  let catalog = "disconnected";
  if (isSupabaseConfigured()) {
    try {
      await getSnapshot();
      catalog = "ok";
    } catch {
      catalog = "error";
    }
  }

  res.json({
    ok: catalog !== "error",
    supabase: isSupabaseConfigured() ? catalog : "not_configured",
    media: isFtpConfigured()
      ? "hostinger_ftp"
      : isSupabaseConfigured()
        ? "supabase_storage"
        : "local_api",
    payments: "not_configured",
  });
}));
