import { NextResponse } from "next/server";
import { getOrderById as getMemoryOrder } from "@/lib/orders";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBearerToken, getRequestUser } from "@/lib/supabase/server";
import { getOrderById } from "@/services/orderService";

export async function GET(request, { params }) {
  const { id } = await params;
  return withBackend(request, `/orders/${encodeURIComponent(id)}`, async () => {
    if (isSupabaseConfigured()) {
      const user = await getRequestUser(request);
      const order = await getOrderById(id, getBearerToken(request));
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      if (user?.role !== "admin" && order.userId && user?.id !== order.userId) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ order });
    }
    const order = getMemoryOrder(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  });
}
