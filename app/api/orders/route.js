import { NextResponse } from "next/server";
import { isExpressAvailable } from "@/data/checkout";
import { createOrder as createMemoryOrder } from "@/lib/orders";
import { withBackend } from "@/lib/withBackend";
import { sendOrderPlacedEmail } from "@/lib/orderEmail";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getRequestUser, getBearerToken } from "@/lib/supabase/server";
import { createOrder } from "@/services/orderService";

function validateOrder(body) {
  const requiredCustomer = ["fullName", "email", "phone"];
  const requiredAddress = ["address", "city", "province", "postalCode"];
  if (!body?.items?.length) return "Your cart is empty.";
  if (!body.customer || requiredCustomer.some((key) => !body.customer[key]?.trim())) {
    return "Please complete your contact details.";
  }
  if (!body.shippingAddress || requiredAddress.some((key) => !body.shippingAddress[key]?.trim())) {
    return "Please complete your delivery address.";
  }
  if (body.paymentMethod !== "cod") {
    return "Please choose Cash on Delivery. Card payments are coming soon.";
  }
  if (!["standard", "express"].includes(body.deliveryMethod)) {
    return "Please choose a delivery method.";
  }
  if (
    body.deliveryMethod === "express" &&
    !isExpressAvailable(body.shippingAddress?.province, body.shippingAddress?.city)
  ) {
    return "Express delivery is available only in Karachi, Sindh.";
  }
  return null;
}

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request) {
  return withBackend(request, "/orders", async () => {
    const body = await request.json();
    const error = validateOrder(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    if (isSupabaseConfigured()) {
      const user = await getRequestUser(request);
      const order = await createOrder(
        { ...body, userId: user?.id || body.userId || "" },
        body.items,
        getBearerToken(request)
      );
      try {
        await sendOrderPlacedEmail(order);
      } catch (error) {
        console.error("Order email failed:", error);
      }
      return NextResponse.json({ order }, { status: 201 });
    }

    const order = createMemoryOrder(body);
    try {
      await sendOrderPlacedEmail(order);
    } catch (error) {
      console.error("Order email failed:", error);
    }
    return NextResponse.json({ order }, { status: 201 });
  });
}
