import { NextResponse } from "next/server";
import { listCoupons } from "@/lib/catalogStore";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { validateCoupon } from "@/services/contentService";
import { AppError } from "@/lib/errors";

function applyMemoryCoupon(code, subtotal) {
  const normalized = String(code || "").trim().toUpperCase();
  const coupon = listCoupons().find(
    (item) => item.active && item.code.toUpperCase() === normalized
  );
  if (!coupon) {
    return { error: "This coupon code is not valid.", status: 400 };
  }
  const amount = Number(subtotal || 0);
  if (amount < coupon.minOrder) {
    return {
      error: `This coupon needs a minimum order of Rs. ${coupon.minOrder}.`,
      status: 400,
    };
  }
  return {
    coupon,
    discount: Math.round(amount * (coupon.discountPercent / 100)),
  };
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (isSupabaseConfigured()) {
    try {
      const data = await validateCoupon(body.code, body.subtotal);
      return NextResponse.json(data);
    } catch (error) {
      const status = error instanceof AppError ? error.status : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
  }
  const result = applyMemoryCoupon(body.code, body.subtotal);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
