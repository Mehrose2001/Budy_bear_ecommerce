import { throwIf, AppError } from "@/lib/errors";
import { mapBanner, mapCoupon, mapProduct, mapSettings } from "@/lib/mappers";
import { createServerClient, createServiceClient, createUserClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getDefaultLegalPage, mergeLegalPage } from "@/data/legalPages";
import { isMissingColumn, normalizeSeo, withEntitySeo } from "@/data/seo";
import { normalizeOffer } from "@/lib/storeOffer";
import { normalizeDeliverySettings } from "@/lib/deliverySettings";
import { parseStoreJsonField } from "@/lib/storeSettingsJson";
import { normalizeSeasonalBanners } from "@/lib/seasonalCollection";
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

let seasonalBannerColumnAvailable;

function seasonalBannerInput(input) {
  if (input.seasonalBanner === undefined && input.seasonal_banner === undefined) return null;
  return normalizeSeasonalBanners(input.seasonalBanner ?? input.seasonal_banner);
}

async function persistDeliverySettings(supabase, delivery) {
  const normalized = normalizeDeliverySettings(delivery);
  const columnTry = await supabase
    .from("store_settings")
    .update({
      delivery_fee: normalized.deliveryFee,
      free_delivery_threshold: normalized.freeDeliveryThreshold,
    })
    .eq("id", 1);
  if (columnTry.error && !/delivery_fee|free_delivery_threshold/i.test(String(columnTry.error.message || ""))) {
    throwIf(columnTry.error, "Unable to update delivery settings.");
  }

  const current = await supabase.from("store_settings").select("legal_pages").eq("id", 1).maybeSingle();
  throwIf(current.error, "Unable to update delivery settings.");
  const saved = await supabase
    .from("store_settings")
    .update({
      legal_pages: {
        ...(current.data?.legal_pages || {}),
        _delivery: normalized,
      },
    })
    .eq("id", 1)
    .select("*")
    .single();
  throwIf(saved.error, "Unable to update delivery settings.");
  return saved.data;
}

async function persistSeasonalBanner(supabase, seasonalBanner) {
  if (seasonalBannerColumnAvailable !== false) {
    const columnTry = await supabase
      .from("store_settings")
      .update({ seasonal_banner: seasonalBanner })
      .eq("id", 1);
    if (!columnTry.error) {
      seasonalBannerColumnAvailable = true;
    } else if (/seasonal_banner/i.test(String(columnTry.error.message || columnTry.error.details || ""))) {
      seasonalBannerColumnAvailable = false;
    } else {
      throwIf(columnTry.error, "Unable to update settings.");
    }
  }

  const current = await supabase.from("store_settings").select("legal_pages").eq("id", 1).maybeSingle();
  throwIf(current.error, "Unable to update settings.");
  const saved = await supabase
    .from("store_settings")
    .update({
      legal_pages: {
        ...(current.data?.legal_pages || {}),
        _seasonalBanner: seasonalBanner,
      },
    })
    .eq("id", 1)
    .select("*")
    .single();
  throwIf(saved.error, "Unable to update settings.");
  return saved.data;
}

async function persistSeoDocument(supabase, seo) {
  const columnTry = await supabase.from("store_settings").update({ seo }).eq("id", 1).select("*").single();
  if (!columnTry.error) return columnTry.data;
  if (!isMissingColumn(columnTry.error, "seo")) throwIf(columnTry.error, "Unable to save SEO settings.");
  const current = await supabase.from("store_settings").select("legal_pages").eq("id", 1).maybeSingle();
  throwIf(current.error, "Unable to save SEO settings.");
  const saved = await supabase
    .from("store_settings")
    .update({
      legal_pages: { ...(current.data?.legal_pages || {}), _seo: seo },
    })
    .eq("id", 1)
    .select("*")
    .single();
  throwIf(saved.error, "Unable to save SEO settings.");
  return saved.data;
}

export async function saveStoreSeo(input, accessToken) {
  const supabase = writeClient(accessToken);
  const current = await getStoreSettings();
  const seo = normalizeSeo({ ...normalizeSeo(input), entities: current.seo?.entities });
  return mapSettings(await persistSeoDocument(supabase, seo));
}

export async function removeEntitySeo(group, key, accessToken) {
  if (!key) return null;
  const supabase = writeClient(accessToken);
  const current = await getStoreSettings();
  if (!current?.seo?.entities?.[group]?.[key]) return current;
  const seo = normalizeSeo(current.seo);
  delete seo.entities[group][key];
  return mapSettings(await persistSeoDocument(supabase, seo));
}

export async function saveEntitySeo(group, key, entry, accessToken) {
  const supabase = writeClient(accessToken);
  const current = await getStoreSettings();
  const seo = withEntitySeo(current.seo, group, key, entry);
  return mapSettings(await persistSeoDocument(supabase, seo));
}

export async function getStoreSettings() {
  const supabase = createServiceClient() || client();
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  throwIf(error, "Unable to load settings.", 500);
  return mapSettings(data);
}

export async function getDeliverySettingsForStorefront() {
  if (!isSupabaseConfigured()) {
    const settings = getMemorySettings();
    return normalizeDeliverySettings({
      deliveryFee: settings?.deliveryFee,
      freeDeliveryThreshold: settings?.freeDeliveryThreshold,
    });
  }

  const supabase = createServiceClient() || client();
  throwIf(!supabase, "Supabase is not configured.", 503);
  const { data, error } = await supabase
    .from("store_settings")
    .select("legal_pages")
    .eq("id", 1)
    .maybeSingle();
  throwIf(error, "Unable to load delivery settings.", 500);

  const legal = parseStoreJsonField(data?.legal_pages) || {};
  const embedded =
    legal._delivery && typeof legal._delivery === "object" ? legal._delivery : {};

  return normalizeDeliverySettings({
    deliveryFee: embedded.deliveryFee,
    freeDeliveryThreshold: embedded.freeDeliveryThreshold,
  });
}

export async function updateStoreSettings(input, accessToken) {
  const supabase = writeClient(accessToken);
  const payload = {
    store_name: input.storeName,
    announcement: input.announcement,
    support_email: String(input.supportEmail || input.support_email || "").trim(),
    support_phone: String(input.supportPhone || input.support_phone || "").trim(),
    seasonal_collection: String(input.seasonalCollection || "").toLowerCase() === "summer" ? "summer" : "winter",
  };
  const offer = input.offer === undefined ? null : normalizeOffer(input.offer);
  if (offer) payload.offer = offer;
  const seasonalBanner = seasonalBannerInput(input);
  let { data, error } = await supabase
    .from("store_settings")
    .update(payload)
    .eq("id", 1)
    .select("*")
    .single();
  if (error && offer && /offer/i.test(String(error.message || error.details || ""))) {
    const current = await supabase.from("store_settings").select("legal_pages").eq("id", 1).maybeSingle();
    const withoutOffer = { ...payload };
    delete withoutOffer.offer;
    const retry = await supabase
      .from("store_settings")
      .update({
        ...withoutOffer,
        legal_pages: { ...(current.data?.legal_pages || {}), _offer: offer },
      })
      .eq("id", 1)
      .select("*")
      .single();
    throwIf(retry.error, "Unable to update settings.");
    data = retry.data;
    error = null;
  }
  if (error && /seasonal_collection/i.test(String(error.message || error.details || ""))) {
    const { seasonal_collection: _season, ...legacy } = payload;
    const retry = await supabase
      .from("store_settings")
      .update(legacy)
      .eq("id", 1)
      .select("*")
      .single();
    throwIf(retry.error, "Unable to update settings.");
    const saved = seasonalBanner ? await persistSeasonalBanner(supabase, seasonalBanner) : retry.data;
    return {
      ...mapSettings(saved),
      seasonalCollection: payload.seasonal_collection,
    };
  }
  throwIf(error, "Unable to update settings.");
  if (seasonalBanner) data = await persistSeasonalBanner(supabase, seasonalBanner);
  if (input.deliveryFee !== undefined || input.freeDeliveryThreshold !== undefined) {
    data = await persistDeliverySettings(supabase, {
      deliveryFee: input.deliveryFee,
      freeDeliveryThreshold: input.freeDeliveryThreshold,
    });
  }
  const mapped = mapSettings(data);
  if (input.deliveryFee !== undefined || input.freeDeliveryThreshold !== undefined) {
    return {
      ...mapped,
      ...normalizeDeliverySettings({
        deliveryFee: input.deliveryFee ?? mapped.deliveryFee,
        freeDeliveryThreshold: input.freeDeliveryThreshold ?? mapped.freeDeliveryThreshold,
      }),
    };
  }
  return mapped;
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

function bannerRow(input, { includeMobile = true } = {}) {
  const mobile = input.mobileImage || input.mobile_image || "";
  const row = {
    id: input.id || `b${Date.now()}`,
    title: input.title,
    image: input.image,
    href: input.href || "/products",
    active: input.active !== false,
  };
  if (includeMobile) {
    row.mobile_image = mobile || null;
  } else if (mobile && mobile !== input.image) {
    row.image = JSON.stringify({ web: input.image, mobile });
  }
  return row;
}

export async function upsertBanner(input, accessToken) {
  const supabase = writeClient(accessToken);
  const draft = { ...input, id: input.id || `b${Date.now()}` };
  let saved = await supabase.from("banners").upsert(bannerRow(draft)).select("*").single();
  if (saved.error && /mobile_image/i.test(String(saved.error.message || ""))) {
    saved = await supabase
      .from("banners")
      .upsert(bannerRow(draft, { includeMobile: false }))
      .select("*")
      .single();
  }
  throwIf(saved.error, saved.error?.message || "Unable to save banner.");
  return mapBanner(saved.data);
}

export async function deleteBanner(id, accessToken) {
  const supabase = writeClient(accessToken);
  const { error } = await supabase.from("banners").delete().eq("id", id);
  throwIf(error, "Unable to delete banner.");
}

export async function listWishlist(userId, accessToken) {
  const supabase = writeClient(accessToken);
  const { data, error } = await supabase
    .from("wishlists")
    .select("product_id, products(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  throwIf(error, "Unable to load wishlist.", 500);
  return (data || []).map((row) => mapProduct(row.products)).filter(Boolean);
}

export async function addWishlistItem(userId, productId, accessToken) {
  const supabase = writeClient(accessToken);
  const { error } = await supabase
    .from("wishlists")
    .upsert({ user_id: userId, product_id: Number(productId) });
  throwIf(error, "Unable to save favourite.");
}

async function saveLegalPagesJson(supabase, slug, intro, body) {
  const current = await supabase.from("store_settings").select("legal_pages").eq("id", 1).maybeSingle();
  const legalPages = {
    ...(current.data?.legal_pages || {}),
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
  const supabase = writeClient(accessToken);
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", Number(productId));
  throwIf(error, "Unable to update saved favourites.");
}
