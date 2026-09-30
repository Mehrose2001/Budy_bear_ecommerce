import { NextResponse } from "next/server";
import { isAdminRequest, getAccessToken } from "@/lib/adminAuth";
import {
  deleteCoupon,
  deleteBanner,
  deleteReview,
  getSettings,
  listBanners,
  listCoupons,
  listProducts,
  listReviews,
  updateReview,
  updateSettings,
  upsertBanner,
  upsertCoupon,
} from "@/lib/catalogStore";
import { listOrders } from "@/lib/orders";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProducts } from "@/services/productService";
import { getAllOrders } from "@/services/orderService";
import { deleteReview as deleteDbReview, getAllReviews, updateReview as updateDbReview } from "@/services/reviewService";
import {
  deleteBanner as deleteDbBanner,
  deleteCoupon as deleteDbCoupon,
  getStoreSettings,
  listBanners as listDbBanners,
  listCoupons as listDbCoupons,
  updateStoreSettings,
  upsertBanner as upsertDbBanner,
  upsertCoupon as upsertDbCoupon,
} from "@/services/contentService";

function statsFrom(orders, products) {
  const sales = orders
    .filter((order) => order.orderStatus !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const customers = new Set(orders.map((order) => order.customer?.email).filter(Boolean));
  return {
    totalSales: sales,
    totalOrders: orders.length,
    customers: customers.size,
    products: products.length,
    recentOrders: orders.slice(0, 6),
  };
}

export async function GET(request) {
  return withBackend(request, "/admin/content", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = getAccessToken(request);
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource") || "stats";

    if (isSupabaseConfigured()) {
      if (resource === "stats") {
        const [orders, products] = await Promise.all([
          getAllOrders(token),
          getProducts({ includeInactive: true, accessToken: token }),
        ]);
        return NextResponse.json(statsFrom(orders, products));
      }
      if (resource === "coupons") return NextResponse.json({ coupons: await listDbCoupons({ includeInactive: true, accessToken: token }) });
      if (resource === "banners") return NextResponse.json({ banners: await listDbBanners({ includeInactive: true, accessToken: token }) });
      if (resource === "reviews") return NextResponse.json({ reviews: await getAllReviews(token) });
      if (resource === "settings") return NextResponse.json({ settings: await getStoreSettings() });
      if (resource === "customers") {
        const orders = await getAllOrders(token);
        const map = new Map();
        orders.forEach((order) => {
          const email = order.customer?.email;
          if (!email) return;
          const current = map.get(email) || {
            email,
            name: order.customer.fullName,
            phone: order.customer.phone,
            orders: 0,
            spent: 0,
          };
          current.orders += 1;
          current.spent += order.total;
          map.set(email, current);
        });
        return NextResponse.json({ customers: Array.from(map.values()) });
      }
      return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }

    if (resource === "stats") {
      return NextResponse.json(statsFrom(listOrders(), listProducts()));
    }
    if (resource === "coupons") return NextResponse.json({ coupons: listCoupons() });
    if (resource === "banners") return NextResponse.json({ banners: listBanners() });
    if (resource === "reviews") return NextResponse.json({ reviews: listReviews() });
    if (resource === "settings") return NextResponse.json({ settings: getSettings() });
    if (resource === "customers") {
      const map = new Map();
      listOrders().forEach((order) => {
        const email = order.customer?.email;
        if (!email) return;
        const current = map.get(email) || {
          email,
          name: order.customer.fullName,
          phone: order.customer.phone,
          orders: 0,
          spent: 0,
        };
        current.orders += 1;
        current.spent += order.total;
        map.set(email, current);
      });
      return NextResponse.json({ customers: Array.from(map.values()) });
    }

    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  });
}

export async function POST(request) {
  return withBackend(request, "/admin/content", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const token = getAccessToken(request);
    if (isSupabaseConfigured()) {
      if (body.resource === "coupons") return NextResponse.json({ coupon: await upsertDbCoupon(body.data, token) });
      if (body.resource === "banners") return NextResponse.json({ banner: await upsertDbBanner(body.data, token) });
      if (body.resource === "settings") return NextResponse.json({ settings: await updateStoreSettings(body.data, token) });
      if (body.resource === "reviews") return NextResponse.json({ review: await updateDbReview(body.data.id, body.data, token) });
      return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }
    if (body.resource === "coupons") return NextResponse.json({ coupon: upsertCoupon(body.data) });
    if (body.resource === "banners") return NextResponse.json({ banner: upsertBanner(body.data) });
    if (body.resource === "settings") return NextResponse.json({ settings: updateSettings(body.data) });
    if (body.resource === "reviews") return NextResponse.json({ review: updateReview(body.data.id, body.data) });
    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  });
}

export async function DELETE(request) {
  return withBackend(request, "/admin/content", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const id = searchParams.get("id");
    const token = getAccessToken(request);
    if (isSupabaseConfigured()) {
      if (resource === "coupons") await deleteDbCoupon(id, token);
      if (resource === "banners") await deleteDbBanner(id, token);
      if (resource === "reviews") await deleteDbReview(id, token);
      return NextResponse.json({ ok: true });
    }
    if (resource === "coupons") deleteCoupon(id);
    if (resource === "banners") deleteBanner(id);
    if (resource === "reviews") deleteReview(id);
    return NextResponse.json({ ok: true });
  });
}
