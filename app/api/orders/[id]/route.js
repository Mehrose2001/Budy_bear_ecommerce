import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders";

export async function GET(_request, { params }) {
  const { id } = await params;
  const order = getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
