import { NextResponse } from "next/server";
import { withBackend } from "@/lib/withBackend";
import { isLiveBackendConfigured } from "@/lib/backendMode";
import { getBearerToken, getRequestUser } from "@/lib/supabase/server";
import { getUserOrders } from "@/services/orderService";

export async function GET(request) {
  return withBackend(request, "/orders/mine", async () => {
    if (!isLiveBackendConfigured()) {
      return NextResponse.json({ orders: [] });
    }
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    const orders = await getUserOrders(user.id, getBearerToken(request));
    return NextResponse.json({ orders });
  });
}
