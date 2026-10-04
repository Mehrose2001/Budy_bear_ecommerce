import { NextResponse } from "next/server";
import { getOrderById as getMemoryOrder } from "@/lib/orders";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { trackOrder } from "@/services/orderService";
import { orderPhone, phonesMatch, toPublicTrackOrder } from "@/lib/orderTracking";

export async function POST(request) {
  return withBackend(request, "/orders/track", async () => {
    const body = await request.json().catch(() => ({}));
    const orderId = String(body.orderId || body.id || "").trim();
    const phone = String(body.phone || "").trim();
    if (!orderId || !phone) {
      return NextResponse.json(
        { error: "Order ID and phone number are required." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const order = await trackOrder(orderId, phone);
      return NextResponse.json({ order });
    }

    const memory = getMemoryOrder(orderId);
    if (!memory || !phonesMatch(orderPhone(memory), phone)) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ order: toPublicTrackOrder(memory) });
  });
}
