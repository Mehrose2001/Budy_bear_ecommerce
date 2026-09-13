import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { listOrders, updateOrderStatus } from "@/lib/orders";
import { ORDER_STATUSES } from "@/data/admin";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ orders: listOrders() });
}

export async function PATCH(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!ORDER_STATUSES.includes(body.orderStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = updateOrderStatus(body.id, body.orderStatus);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}
