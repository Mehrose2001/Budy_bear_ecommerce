import { NextResponse } from "next/server";
import { getSettings } from "@/lib/catalogStore";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { EMPTY_OFFER, normalizeOffer } from "@/lib/storeOffer";
import { getStoreSettings } from "@/services/contentService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = isSupabaseConfigured() ? await getStoreSettings() : getSettings();
    return NextResponse.json({ offer: normalizeOffer(settings?.offer || EMPTY_OFFER) });
  } catch {
    return NextResponse.json({ offer: EMPTY_OFFER });
  }
}
