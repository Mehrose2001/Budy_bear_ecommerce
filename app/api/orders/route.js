import { NextResponse } from "next/server";
import { isExpressAvailable } from "@/data/checkout";
import { createOrder, listOrders } from "@/lib/orders";

function validateOrder(body) {
  const requiredCustomer = ["fullName", "email", "phone"];
  const requiredAddress = ["address", "city", "province", "postalCode"];

  if (!body?.items?.length) {
    return "Your cart is empty.";
  }

  if (!body.customer || requiredCustomer.some((key) => !body.customer[key]?.trim())) {
    return "Please complete your contact details.";
  }

  if (
    !body.shippingAddress ||
    requiredAddress.some((key) => !body.shippingAddress[key]?.trim())
  ) {
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
  return NextResponse.json({ orders: listOrders() });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const error = validateOrder(body);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const order = createOrder(body);
    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create this order. Please try again." },
      { status: 500 }
    );
  }
}
