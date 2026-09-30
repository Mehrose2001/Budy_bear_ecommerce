import { NextResponse } from "next/server";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBearerToken, getRequestUser } from "@/lib/supabase/server";
import { addWishlistItem, listWishlist } from "@/services/contentService";

export async function GET(request) {
  return withBackend(request, "/wishlist", async () => {
    if (!isSupabaseConfigured()) return NextResponse.json({ items: [] });
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ items: [] });
    const items = await listWishlist(user.id, getBearerToken(request));
    return NextResponse.json({ items });
  });
}

export async function POST(request) {
  return withBackend(request, "/wishlist", async () => {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Sign in to save favourites to your account." }, { status: 401 });
    }
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to save favourites to your account." }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    await addWishlistItem(user.id, body.productId, getBearerToken(request));
    const items = await listWishlist(user.id, getBearerToken(request));
    return NextResponse.json({ items });
  });
}
