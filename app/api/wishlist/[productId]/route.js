import { NextResponse } from "next/server";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBearerToken, getRequestUser } from "@/lib/supabase/server";
import { listWishlist, removeWishlistItem } from "@/services/contentService";

export async function DELETE(request, { params }) {
  const { productId } = await params;
  return withBackend(request, `/wishlist/${productId}`, async () => {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Sign in to update saved favourites." }, { status: 401 });
    }
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to update saved favourites." }, { status: 401 });
    }
    await removeWishlistItem(user.id, productId, getBearerToken(request));
    const items = await listWishlist(user.id, getBearerToken(request));
    return NextResponse.json({ items });
  });
}
