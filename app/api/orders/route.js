import { NextResponse } from "next/server";
import { isExpressAvailable } from "@/data/checkout";
import { createOrder as createMemoryOrder } from "@/lib/orders";
import { withBackend } from "@/lib/withBackend";
import { sendOrderPlacedEmail } from "@/lib/orderEmail";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getRequestUser, getBearerToken } from "@/lib/supabase/server";
import { computeCheckoutTotals } from "@/lib/checkoutTotals";
import { validateCoupon } from "@/services/contentService";
import { listCoupons } from "@/lib/catalogStore";
import { createOrder } from "@/services/orderService";

function validateOrder(body) {
  const requiredCustomer = ["fullName", "phone"];
  const requiredAddress = ["address", "city", "province"];
  if (!body?.items?.length) return "Your cart is empty.";
  if (!body.customer || requiredCustomer.some((key) => !body.customer[key]?.trim())) {
    return "Please complete your contact details.";
  }
  const email = body.customer.email?.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
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

    let couponPercent = 0;
    if (body.couponCode) {
      try {
        if (isSupabaseConfigured()) {
          const saleSubtotal = (body.items || []).reduce(
            (sum, item) => sum + Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1),
            0
          );
          const checked = await validateCoupon(body.couponCode, saleSubtotal);
          couponPercent = Number(checked.coupon?.discountPercent || 0);
        } else {
          const memory = listCoupons().find(
            (item) =>
              item.active && item.code.toUpperCase() === String(body.couponCode).toUpperCase()
          );
          couponPercent = Number(memory?.discountPercent || 0);
        }
      } catch {
        couponPercent = 0;
      }
    }

    const priced = computeCheckoutTotals({
      items: body.items,
      couponPercent,
      couponDiscount: body.couponDiscount || 0,
      deliveryMethod: body.deliveryMethod,
    });
    const payload = {
      ...body,
      subtotal: priced.subtotal,
      discount: priced.discount,
      shipping: priced.shipping,
      total: priced.total,
      couponCode: body.couponCode || "",
    };

    if (isSupabaseConfigured()) {
      const user = await getRequestUser(request);
      const order = await createOrder(
        { ...payload, userId: user?.id || body.userId || "" },
        body.items,
        getBearerToken(request)
      );
      try {
        const emailed = await sendOrderPlacedEmail(order);
        if (!emailed) {
          console.warn("Order placed without email: SMTP is not configured.");
        }
      } catch (error) {
        console.error("Order email failed:", error?.message || error);
      }
      return NextResponse.json({ order }, { status: 201 });
    }

    const order = createMemoryOrder(payload);
    try {
      const emailed = await sendOrderPlacedEmail(order);
      if (!emailed) {
        console.warn("Order placed without email: SMTP is not configured.");
      }
    } catch (error) {
      console.error("Order email failed:", error?.message || error);
    }
    return NextResponse.json({ order }, { status: 201 });
  });
}
