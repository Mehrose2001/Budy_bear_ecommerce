import { Router } from "express";
import multer from "multer";
import { ORDER_STATUSES } from "./orderStatuses.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { requireAdmin, requireUser } from "../middleware/auth.js";
import {
  addWishlist,
  createProduct,
  deleteBanner,
  deleteCategory,
  deleteCoupon,
  deleteProduct,
  deleteReview,
  getProductById,
  getSnapshot,
  listWishlist,
  removeWishlist,
  updateProduct,
  updateReview,
  updateSettings,
  getStorePage,
  upsertStorePage,
  upsertBanner,
  upsertCategory,
  upsertCoupon,
} from "../services/catalog.js";
import { listCustomersFromOrders, listOrders, updateOrderStatus } from "../services/orders.js";
import { storeImage } from "../services/storage.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
});

export const adminRouter = Router();
export const wishlistRouter = Router();

wishlistRouter.get(
  "/",
  requireUser,
  asyncHandler(async (req, res) => {
    const items = await listWishlist(req.user.id);
    res.json({ items });
  })
);

wishlistRouter.post(
  "/",
  requireUser,
  asyncHandler(async (req, res) => {
    const items = await addWishlist(req.user.id, req.body.productId);
    res.json({ items });
  })
);

wishlistRouter.delete(
  "/:productId",
  requireUser,
  asyncHandler(async (req, res) => {
    const items = await removeWishlist(req.user.id, req.params.productId);
    res.json({ items });
  })
);

adminRouter.get(
  "/stats",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const [snapshot, orders] = await Promise.all([getSnapshot(), listOrders()]);
    const sales = orders
      .filter((order) => order.orderStatus !== "Cancelled")
      .reduce((sum, order) => sum + order.total, 0);
    const customers = new Set(orders.map((order) => order.customer?.email).filter(Boolean));
    res.json({
      totalSales: sales,
      totalOrders: orders.length,
      customers: customers.size,
      products: snapshot.products.length,
      recentOrders: orders.slice(0, 6),
    });
  })
);

adminRouter.get(
  "/products",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const snapshot = await getSnapshot();
    res.json({ products: snapshot.products });
  })
);

adminRouter.post(
  "/products",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!req.body?.name || !req.body?.category || !req.body?.price) {
      throw new HttpError(400, "Name, category and price are required.");
    }
    if (!String(req.body?.slug || "").trim()) {
      throw new HttpError(400, "Slug is required.");
    }
    const product = await createProduct(req.body);
    res.status(201).json({ product });
  })
);

adminRouter.put(
  "/products",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!String(req.body?.slug || "").trim()) {
      throw new HttpError(400, "Slug is required.");
    }
    const product = await updateProduct(req.body.id, req.body);
    res.json({ product });
  })
);

adminRouter.delete(
  "/products",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existing = await getProductById(req.query.id);
    if (!existing) throw new HttpError(404, "Product not found");
    await deleteProduct(req.query.id);
    res.json({ ok: true });
  })
);

adminRouter.get(
  "/categories",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const snapshot = await getSnapshot();
    res.json({ categories: snapshot.categories });
  })
);

adminRouter.post(
  "/categories",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!req.body?.name || !req.body?.slug) {
      throw new HttpError(400, "Name and slug are required.");
    }
    const category = await upsertCategory(req.body);
    res.json({ category });
  })
);

adminRouter.delete(
  "/categories",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await deleteCategory(req.query.slug);
    res.json({ ok: true });
  })
);

adminRouter.get(
  "/orders",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json({ orders: await listOrders() });
  })
);

adminRouter.patch(
  "/orders",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!ORDER_STATUSES.includes(req.body.orderStatus)) {
      throw new HttpError(400, "Invalid status");
    }
    const order = await updateOrderStatus(req.body.id, req.body.orderStatus);
    res.json({ order });
  })
);

adminRouter.get(
  "/content",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const resource = req.query.resource || "stats";
    const snapshot = await getSnapshot();
    const orders = await listOrders();

    if (resource === "stats") {
      const sales = orders
        .filter((order) => order.orderStatus !== "Cancelled")
        .reduce((sum, order) => sum + order.total, 0);
      const customers = new Set(orders.map((order) => order.customer?.email).filter(Boolean));
      return res.json({
        totalSales: sales,
        totalOrders: orders.length,
        customers: customers.size,
        products: snapshot.products.length,
        recentOrders: orders.slice(0, 6),
      });
    }
    if (resource === "coupons") return res.json({ coupons: snapshot.coupons });
    if (resource === "banners") return res.json({ banners: snapshot.banners });
    if (resource === "reviews") return res.json({ reviews: snapshot.reviews });
    if (resource === "settings") return res.json({ settings: snapshot.settings });
    if (resource === "pages") {
      const slug = req.query.slug;
      return res.json({ page: await getStorePage(slug) });
    }
    if (resource === "customers") {
      return res.json({ customers: listCustomersFromOrders(orders) });
    }
    throw new HttpError(400, "Unknown resource");
  })
);

adminRouter.post(
  "/content",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { resource, data } = req.body || {};
    if (resource === "coupons") return res.json({ coupon: await upsertCoupon(data) });
    if (resource === "banners") return res.json({ banner: await upsertBanner(data) });
    if (resource === "settings") return res.json({ settings: await updateSettings(data) });
    if (resource === "pages") return res.json({ page: await upsertStorePage(data) });
    if (resource === "reviews") return res.json({ review: await updateReview(data.id, data) });
    throw new HttpError(400, "Unknown resource");
  })
);

adminRouter.delete(
  "/content",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const resource = req.query.resource;
    const id = req.query.id;
    if (resource === "coupons") await deleteCoupon(id);
    else if (resource === "banners") await deleteBanner(id);
    else if (resource === "reviews") await deleteReview(id);
    else throw new HttpError(400, "Unknown resource");
    res.json({ ok: true });
  })
);

adminRouter.post(
  "/uploads",
  requireAdmin,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const folder = req.body?.folder === "banners" || req.body?.folder === "categories"
      ? req.body.folder
      : "products";
    const url = await storeImage(req.file, folder);
    res.json({ url });
  })
);
