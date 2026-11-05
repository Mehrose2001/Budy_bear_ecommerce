import { NextResponse } from "next/server";
import { normalizeDeliverySettings } from "@/lib/deliverySettings";
import { getDeliverySettingsForStorefront } from "@/services/contentService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const delivery = await getDeliverySettingsForStorefront();
    return NextResponse.json({ delivery });
  } catch (error) {
    console.error("delivery-settings:", error?.message || error);
    return NextResponse.json({ delivery: normalizeDeliverySettings(null) });
  }
}
