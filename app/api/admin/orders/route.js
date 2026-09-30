import { NextResponse } from "next/server";
import { isAdminRequest, getAccessToken } from "@/lib/adminAuth";
import { listOrders as listMemoryOrders, updateOrderStatus as updateMemoryOrder } from "@/lib/orders";
import { ORDER_STATUSES } from "@/data/admin";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllOrders, updateOrderStatus, updatePaymentStatus } from "@/services/orderService";

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
