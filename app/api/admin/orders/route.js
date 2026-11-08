import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { isAdminRequest, getAccessToken } from "@/lib/adminAuth";
import {
  deleteOrder as deleteMemoryOrder,
  listOrders as listMemoryOrders,
  updateOrderStatus as updateMemoryOrder,
} from "@/lib/orders";
import { ORDER_STATUSES } from "@/data/admin";
import { invalidateCatalogSnapshot } from "@/lib/catalog";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  deleteOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
} from "@/services/orderService";

export async function GET(request) {
  return withBackend(request, "/admin/orders", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isSupabaseConfigured()) {
      const orders = await getAllOrders(getAccessToken(request));
      return NextResponse.json({ orders });
    }
    return NextResponse.json({ orders: listMemoryOrders() });
  });
}

export async function PATCH(request) {
  return withBackend(request, "/admin/orders", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    if (body.paymentStatus && isSupabaseConfigured()) {
      const order = await updatePaymentStatus(body.id, body.paymentStatus, getAccessToken(request));
      return NextResponse.json({ order });
    }
    if (!ORDER_STATUSES.includes(body.orderStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (isSupabaseConfigured()) {
      const order = await updateOrderStatus(body.id, body.orderStatus, getAccessToken(request));
      return NextResponse.json({ order });
    }
    const order = updateMemoryOrder(body.id, body.orderStatus);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  });
}

export async function DELETE(request) {
  return withBackend(request, "/admin/orders", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Order id is required." }, { status: 400 });
    if (isSupabaseConfigured()) {
      try {
        await deleteOrder(id, getAccessToken(request));
        invalidateCatalogSnapshot();
        return NextResponse.json({ ok: true, id });
      } catch (error) {
        const status = error instanceof AppError ? error.status : 400;
        const message =
          (error && typeof error === "object" && error.message) ||
          "Unable to delete order.";
        return NextResponse.json({ error: message }, { status });
      }
    }
    if (!deleteMemoryOrder(id)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    invalidateCatalogSnapshot();
    return NextResponse.json({ ok: true, id });
  });
}
