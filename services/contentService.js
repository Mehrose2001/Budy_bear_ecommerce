import { throwIf, AppError } from "@/lib/errors";
import { mapBanner, mapCoupon, mapSettings } from "@/lib/mappers";
import { createServerClient, createServiceClient, createUserClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getDefaultLegalPage, mergeLegalPage } from "@/data/legalPages";
import { getSettings as getMemorySettings, updateSettings as updateMemorySettings } from "@/lib/catalogStore";

function client(accessToken) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase is not configured.", 503);
  }
  return accessToken ? createUserClient(accessToken) : createServerClient();
}

function writeClient(accessToken) {
  return createServiceClient() || client(accessToken);
}

export async function getStoreSettings() {
  const supabase = client();
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  throwIf(error, "Unable to load settings.", 500);
  return mapSettings(data);
}

export async function updateStoreSettings(input, accessToken) {
  const supabase = client(accessToken);
  const payload = {
    store_name: input.storeName,
    announcement: input.announcement,
    support_email: input.supportEmail,
    support_phone: input.supportPhone,
    seasonal_collection: String(input.seasonalCollection || "").toLowerCase() === "summer" ? "summer" : "winter",
  };
  const { data, error } = await supabase
    .from("store_settings")
    .update(payload)
    .eq("id", 1)
    .select("*")
    .single();
  if (error && /seasonal_collection/i.test(String(error.message || error.details || ""))) {
    const { seasonal_collection: _season, ...legacy } = payload;
    const retry = await supabase
      .from("store_settings")
      .update(legacy)
      .eq("id", 1)
      .select("*")
      .single();
    throwIf(retry.error, "Unable to update settings.");
    return {
      ...mapSettings(retry.data),
      seasonalCollection: payload.seasonal_collection,
    };
  }
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
  const supabase = writeClient(accessToken);
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
  const supabase = writeClient(accessToken);
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

async function saveLegalPagesJson(supabase, slug, intro, body) {
  const current = await getStoreSettings();
  const legalPages = {
    ...(current.legalPages || {}),
    [slug]: { intro, body },
  };
  const retry = await supabase
    .from("store_settings")
    .update({ legal_pages: legalPages })
    .eq("id", 1)
    .select("*")
    .single();
  return retry;
}

export async function getStorePage(slug) {
  const defaults = getDefaultLegalPage(slug);
  if (!defaults) return null;
  if (!isSupabaseConfigured()) {
    return mergeLegalPage(slug, getMemorySettings()?.legalPages?.[slug]);
  }
  try {
    const settings = await getStoreSettings();
    const fromSettings = settings.legalPages?.[slug];
    if (String(fromSettings?.intro || "").trim() || String(fromSettings?.body || "").trim()) {
      return mergeLegalPage(slug, fromSettings);
    }
    const supabase = client();
    const fromTable = await supabase.from("store_pages").select("*").eq("slug", slug).maybeSingle();
    if (!fromTable.error && fromTable.data) {
      return mergeLegalPage(slug, fromTable.data);
    }
    return mergeLegalPage(slug, fromSettings);
  } catch {
    return mergeLegalPage(slug, getMemorySettings()?.legalPages?.[slug]);
  }
}

export async function upsertStorePage(input, accessToken) {
  const slug = String(input.slug || "");
  const defaults = getDefaultLegalPage(slug);
  if (!defaults) throw new AppError("Unknown page.", 400);
  const row = {
    slug,
    title: defaults.title,
    intro: String(input.intro ?? ""),
    body: String(input.body ?? ""),
  };

  if (!isSupabaseConfigured()) {
    const legalPages = {
      ...(getMemorySettings().legalPages || {}),
      [slug]: { intro: row.intro, body: row.body },
    };
    updateMemorySettings({ legalPages });
    return mergeLegalPage(slug, row);
  }

  const supabase = writeClient(accessToken);
  const jsonSave = await saveLegalPagesJson(supabase, slug, row.intro, row.body);
  const tableSave = await supabase.from("store_pages").upsert(row).select("*").single();
  if (!jsonSave.error || !tableSave.error) return mergeLegalPage(slug, row);

  throw new AppError(
    "Unable to save page. Run backend/sql/012_store_pages.sql in the Supabase SQL editor.",
    400
  );
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
