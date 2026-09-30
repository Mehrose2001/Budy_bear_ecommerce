import { throwIf } from "@/lib/errors";
import { mapBanner, mapCoupon, mapSettings } from "@/lib/mappers";
import { createServerClient, createUserClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AppError } from "@/lib/errors";

function client(accessToken) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase is not configured.", 503);
  }
  return accessToken ? createUserClient(accessToken) : createServerClient();
}

export async function getStoreSettings() {
  const supabase = client();
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  throwIf(error, "Unable to load settings.", 500);
  return mapSettings(data);
}

export async function updateStoreSettings(input, accessToken) {
  const supabase = client(accessToken);
  const { data, error } = await supabase
    .from("store_settings")
    .update({
      store_name: input.storeName,
      announcement: input.announcement,
      support_email: input.supportEmail,
      support_phone: input.supportPhone,
    })
    .eq("id", 1)
    .select("*")
    .single();
  throwIf(error, "Unable to update settings.");
  return mapSettings(data);
}

export async function listCoupons({ includeInactive = false, accessToken } = {}) {
  const supabase = client(accessToken);
  let query = supabase.from("coupons").select("*").order("created_at", { ascending: false });
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  throwIf(error, "Unable to load coupons.", 500);
  return (data || []).map(mapCoupon);
}

export async function validateCoupon(code, subtotal) {
  const coupons = await listCoupons();
  const normalized = String(code || "").trim().toUpperCase();
  const coupon = coupons.find((item) => item.active && item.code.toUpperCase() === normalized);
  if (!coupon) {
    throw new AppError("This coupon code is not valid.", 400);
  }
  const amount = Number(subtotal || 0);
  if (amount < coupon.minOrder) {
    throw new AppError(`This coupon needs a minimum order of Rs. ${coupon.minOrder}.`, 400);
  }
  return {
    coupon,
    discount: Math.round(amount * (coupon.discountPercent / 100)),
  };
}

export async function upsertCoupon(input, accessToken) {
  const supabase = client(accessToken);
  const row = {
    id: input.id || `c${Date.now()}`,
    code: String(input.code || "").toUpperCase(),
    label: input.label,
    discount_percent: Number(input.discountPercent ?? input.discount_percent),
    min_order: Number(input.minOrder ?? input.min_order ?? 0),
    active: input.active !== false,
  };
  const { data, error } = await supabase.from("coupons").upsert(row).select("*").single();
  throwIf(error, "Unable to save coupon.");
  return mapCoupon(data);
}

export async function deleteCoupon(id, accessToken) {
  const supabase = client(accessToken);
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  throwIf(error, "Unable to delete coupon.");
}

export async function listBanners({ includeInactive = false, accessToken } = {}) {
  const supabase = client(accessToken);
  let query = supabase.from("banners").select("*").order("created_at", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  throwIf(error, "Unable to load banners.", 500);
  return (data || []).map(mapBanner);
}

export async function upsertBanner(input, accessToken) {
  const supabase = client(accessToken);
  const row = {
    id: input.id || `b${Date.now()}`,
    title: input.title,
    image: input.image,
    href: input.href || "/products",
    active: input.active !== false,
  };
  const { data, error } = await supabase.from("banners").upsert(row).select("*").single();
  throwIf(error, "Unable to save banner.");
  return mapBanner(data);
}

export async function deleteBanner(id, accessToken) {
  const supabase = client(accessToken);
  const { error } = await supabase.from("banners").delete().eq("id", id);
  throwIf(error, "Unable to delete banner.");
}

export async function listWishlist(userId, accessToken) {
  const supabase = client(accessToken);
  const { data, error } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", userId);
  throwIf(error, "Unable to load wishlist.", 500);
  return (data || []).map((row) => Number(row.product_id));
}

export async function addWishlistItem(userId, productId, accessToken) {
  const supabase = client(accessToken);
  const { error } = await supabase
    .from("wishlists")
    .upsert({ user_id: userId, product_id: Number(productId) });
  throwIf(error, "Unable to save favourite.");
}

export async function removeWishlistItem(userId, productId, accessToken) {
  const supabase = client(accessToken);
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", Number(productId));
  throwIf(error, "Unable to update saved favourites.");
}
