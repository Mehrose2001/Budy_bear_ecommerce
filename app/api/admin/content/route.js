import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
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

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") || "stats";

  if (resource === "stats") {
    const orders = listOrders();
    const products = listProducts();
    const sales = orders
      .filter((order) => order.orderStatus !== "Cancelled")
      .reduce((sum, order) => sum + order.total, 0);
    const customers = new Set(
      orders.map((order) => order.customer?.email).filter(Boolean)
    );

    return NextResponse.json({
      totalSales: sales,
      totalOrders: orders.length,
      customers: customers.size,
      products: products.length,
      recentOrders: orders.slice(0, 6),
    });
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
}

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (body.resource === "coupons") {
    return NextResponse.json({ coupon: upsertCoupon(body.data) });
  }
  if (body.resource === "banners") {
    return NextResponse.json({ banner: upsertBanner(body.data) });
  }
  if (body.resource === "settings") {
    return NextResponse.json({ settings: updateSettings(body.data) });
  }
  if (body.resource === "reviews") {
    return NextResponse.json({ review: updateReview(body.data.id, body.data) });
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
}

export async function DELETE(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");
  const id = searchParams.get("id");

  if (resource === "coupons") deleteCoupon(id);
  if (resource === "banners") deleteBanner(id);
  if (resource === "reviews") deleteReview(id);

  return NextResponse.json({ ok: true });
}
