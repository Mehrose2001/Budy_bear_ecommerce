import { Router } from "express";
import { asyncHandler, HttpError } from "../lib/http.js";
import {
  getProductBySlug,
  getSnapshot,
  listPublishedReviews,
  submitReview,
  validateCoupon,
} from "../services/catalog.js";
import { optionalUser } from "../middleware/auth.js";

export const catalogRouter = Router();

catalogRouter.get(
  "/snapshot",
  asyncHandler(async (_req, res) => {
    const snapshot = await getSnapshot();
    res.json({
      source: snapshot.source,
      products: snapshot.products,
      categories: snapshot.categories,
      settings: snapshot.settings,
      coupons: snapshot.coupons.filter((coupon) => coupon.active),
      banners: snapshot.banners.filter((banner) => banner.active),
    });
  })
);

catalogRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    const snapshot = await getSnapshot();
    const query = String(req.query.q || "").toLowerCase().trim();
    const category = String(req.query.category || "");
    let products = snapshot.products;
    if (category) products = products.filter((product) => product.category === category);
    if (query) {
      products = products.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.subcategory.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query)
      );
    }
    res.json({ products });
  })
);

catalogRouter.get(
  "/products/:slug",
  asyncHandler(async (req, res) => {
    const product = await getProductBySlug(req.params.slug);
    if (!product) throw new HttpError(404, "Product not found");
    const reviews = await listPublishedReviews(product.id);
    const snapshot = await getSnapshot();
    const related = snapshot.products
      .filter(
        (item) =>
          item.id !== product.id &&
          (item.category === product.category || item.subcategory === product.subcategory)
      )
      .slice(0, 8);
    res.json({ product, reviews, related });
  })
);

catalogRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const snapshot = await getSnapshot();
    res.json({ categories: snapshot.categories });
  })
);

catalogRouter.post(
  "/coupons/validate",
  asyncHandler(async (req, res) => {
    const result = await validateCoupon(req.body?.code, req.body?.subtotal);
    res.json(result);
  })
);

catalogRouter.post(
  "/reviews",
  optionalUser,
  asyncHandler(async (req, res) => {
    const review = await submitReview(req.body || {}, req.user?.id || null);
    res.status(201).json({ review });
  })
);
