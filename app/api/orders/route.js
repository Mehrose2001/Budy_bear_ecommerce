import { NextResponse } from "next/server";
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

  if (!["cod", "bank-transfer"].includes(body.paymentMethod)) {
    return "Please choose a valid payment method.";
  }

  if (!["standard", "express"].includes(body.deliveryMethod)) {
    return "Please choose a delivery method.";
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
