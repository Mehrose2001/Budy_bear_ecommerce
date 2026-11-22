import { AppError } from "@/lib/errors";
import { query, queryOne } from "@/lib/db";
import { asBool, asJson, fromJson, normalizeMysqlRow, normalizeMysqlRows } from "@/lib/mysql/helpers";
import { mapBanner, mapCoupon, mapProduct, mapSettings } from "@/lib/mappers";
import { getDefaultLegalPage, mergeLegalPage } from "@/data/legalPages";
import { entryUrlError, normalizeEntry, normalizeSeo, seoInputError, withEntitySeo } from "@/data/seo";
import { normalizeOffer } from "@/lib/storeOffer";
import { normalizeDeliverySettings } from "@/lib/deliverySettings";
import { normalizeSeasonalBanners } from "@/lib/seasonalCollection";
import { normalizeCategoryBanner, normalizeSubcategoryBannerMap } from "@/lib/categoryBanner";

const CATEGORY_BANNER_STORE_KEY = "_categoryBanners";

async function settingsRow() {
  const row = normalizeMysqlRow(await queryOne("SELECT * FROM store_settings WHERE id = 1"));
  return row;
}

export async function getStoreSettings() {
  return mapSettings(await settingsRow());
}

export async function getDeliverySettingsForStorefront() {
  const settings = await getStoreSettings();
  return normalizeDeliverySettings({
    deliveryFee: settings?.deliveryFee,
    freeDeliveryThreshold: settings?.freeDeliveryThreshold,
  });
}

async function persistLegalPages(nextLegal) {
  await query("UPDATE store_settings SET legal_pages = ? WHERE id = 1", [asJson(nextLegal, {})]);
  return settingsRow();
}

export async function saveStoreSeo(input) {
  const invalid = seoInputError(input);
  if (invalid) throw new AppError(invalid, 400);
  const current = await getStoreSettings();
  const seo = normalizeSeo({ ...normalizeSeo(input), entities: current.seo?.entities });
  await query("UPDATE store_settings SET seo = ? WHERE id = 1", [asJson(seo, {})]);
  return getStoreSettings();
}

export async function removeEntitySeo(group, key) {
  if (!key) return getStoreSettings();
  const current = await getStoreSettings();
  if (!current?.seo?.entities?.[group]?.[key]) return current;
  const seo = normalizeSeo(current.seo);
  delete seo.entities[group][key];
  await query("UPDATE store_settings SET seo = ? WHERE id = 1", [asJson(seo, {})]);
  return getStoreSettings();
}

export async function saveEntitySeo(group, key, entry) {
  const invalid = entryUrlError(entry, "Saved");
  if (invalid) throw new AppError(invalid, 400);
  const current = await getStoreSettings();
  const seo = withEntitySeo(current.seo, group, key, entry);
  await query("UPDATE store_settings SET seo = ? WHERE id = 1", [asJson(seo, {})]);
  return getStoreSettings();
}

export async function updateStoreSettings(input) {
  const payload = {
    store_name: input.storeName,
    announcement: input.announcement,
    support_email: String(input.supportEmail || input.support_email || "").trim(),
    support_phone: String(input.supportPhone || input.support_phone || "").trim(),
    seasonal_collection:
      String(input.seasonalCollection || "").toLowerCase() === "summer" ? "summer" : "winter",
  };
  const offer = input.offer === undefined ? null : normalizeOffer(input.offer);
  const seasonalBanner =
    input.seasonalBanner === undefined && input.seasonal_banner === undefined
      ? null
      : normalizeSeasonalBanners(input.seasonalBanner ?? input.seasonal_banner);
  const sets = [
    "store_name = ?",
    "announcement = ?",
    "support_email = ?",
    "support_phone = ?",
    "seasonal_collection = ?",
  ];
  const values = [
    payload.store_name,
    payload.announcement,
    payload.support_email,
    payload.support_phone,
    payload.seasonal_collection,
  ];
  if (offer) {
    sets.push("offer = ?");
    values.push(asJson(offer, {}));
  }
  if (seasonalBanner) {
    sets.push("seasonal_banner = ?");
    values.push(asJson(seasonalBanner, {}));
  }
  if (input.deliveryFee !== undefined || input.freeDeliveryThreshold !== undefined) {
    const delivery = normalizeDeliverySettings({
      deliveryFee: input.deliveryFee,
      freeDeliveryThreshold: input.freeDeliveryThreshold,
    });
    sets.push("delivery_fee = ?", "free_delivery_threshold = ?");
    values.push(delivery.deliveryFee, delivery.freeDeliveryThreshold);
    const current = await settingsRow();
    const legal = fromJson(current?.legal_pages, {}) || {};
    sets.push("legal_pages = ?");
    values.push(asJson({ ...legal, _delivery: delivery }, {}));
  }
  await query(`UPDATE store_settings SET ${sets.join(", ")} WHERE id = 1`, values);
  return getStoreSettings();
}

export async function listCoupons({ includeInactive = false } = {}) {
  const sql = includeInactive
    ? "SELECT * FROM coupons ORDER BY created_at DESC"
    : "SELECT * FROM coupons WHERE active = 1 ORDER BY created_at DESC";
  return normalizeMysqlRows(await query(sql)).map(mapCoupon).filter(Boolean);
}

export async function validateCoupon(code, subtotal) {
  const coupons = await listCoupons();
  const normalized = String(code || "").trim().toUpperCase();
  const coupon = coupons.find((item) => item.active && item.code.toUpperCase() === normalized);
  if (!coupon) throw new AppError("This coupon code is not valid.", 400);
  const amount = Number(subtotal || 0);
  if (amount < coupon.minOrder) {
    throw new AppError(`This coupon needs a minimum order of Rs. ${coupon.minOrder}.`, 400);
  }
  return { coupon, discount: Math.round(amount * (coupon.discountPercent / 100)) };
}

export async function upsertCoupon(input) {
  const row = {
    id: input.id || `c${Date.now()}`,
    code: String(input.code || "").toUpperCase(),
    label: input.label,
    discount_percent: Number(input.discountPercent ?? input.discount_percent),
    min_order: Number(input.minOrder ?? input.min_order ?? 0),
    active: asBool(input.active !== false),
  };
  await query(
    `INSERT INTO coupons (id, code, label, discount_percent, min_order, active)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE code=VALUES(code), label=VALUES(label), discount_percent=VALUES(discount_percent),
       min_order=VALUES(min_order), active=VALUES(active)`,
    [row.id, row.code, row.label, row.discount_percent, row.min_order, row.active]
  );
  return mapCoupon(normalizeMysqlRow(await queryOne("SELECT * FROM coupons WHERE id = ?", [row.id])));
}

export async function deleteCoupon(id) {
  await query("DELETE FROM coupons WHERE id = ?", [id]);
}

export async function listBanners({ includeInactive = false } = {}) {
  const sql = includeInactive
    ? "SELECT * FROM banners ORDER BY created_at ASC"
    : "SELECT * FROM banners WHERE active = 1 ORDER BY created_at ASC";
  return normalizeMysqlRows(await query(sql)).map(mapBanner).filter(Boolean);
}

export async function upsertBanner(input) {
  const id = input.id || `b${Date.now()}`;
  await query(
    `INSERT INTO banners (id, title, image, mobile_image, href, active)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title=VALUES(title), image=VALUES(image), mobile_image=VALUES(mobile_image),
       href=VALUES(href), active=VALUES(active)`,
    [
      id,
      input.title,
      input.image,
      input.mobileImage || input.mobile_image || null,
      input.href || "/products",
      asBool(input.active !== false),
    ]
  );
  return mapBanner(normalizeMysqlRow(await queryOne("SELECT * FROM banners WHERE id = ?", [id])));
}

export async function deleteBanner(id) {
  await query("DELETE FROM banners WHERE id = ?", [id]);
}

export async function listWishlist(userId) {
  const rows = await query(
    `SELECT p.* FROM wishlists w
     JOIN products p ON p.id = w.product_id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return normalizeMysqlRows(rows).map(mapProduct).filter(Boolean);
}

export async function addWishlistItem(userId, productId) {
  await query(
    "INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)",
    [userId, Number(productId)]
  );
}

export async function removeWishlistItem(userId, productId) {
  await query("DELETE FROM wishlists WHERE user_id = ? AND product_id = ?", [userId, Number(productId)]);
}

export async function getStorePage(slug) {
  const defaults = getDefaultLegalPage(slug);
  if (!defaults) return null;
  const settings = await getStoreSettings();
  const fromSettings = settings.legalPages?.[slug];
  if (String(fromSettings?.intro || "").trim() || String(fromSettings?.body || "").trim()) {
    return mergeLegalPage(slug, fromSettings);
  }
  const row = await queryOne("SELECT * FROM store_pages WHERE slug = ?", [slug]);
  if (row) return mergeLegalPage(slug, row);
  return mergeLegalPage(slug, fromSettings);
}

export async function upsertStorePage(input) {
  const slug = String(input.slug || "");
  const defaults = getDefaultLegalPage(slug);
  if (!defaults) throw new AppError("Unknown page.", 400);
  const row = {
    slug,
    title: defaults.title,
    intro: String(input.intro ?? ""),
    body: String(input.body ?? ""),
  };
  const current = await settingsRow();
  const legal = fromJson(current?.legal_pages, {}) || {};
  legal[slug] = { intro: row.intro, body: row.body };
  await query("UPDATE store_settings SET legal_pages = ? WHERE id = 1", [asJson(legal, {})]);
  await query(
    `INSERT INTO store_pages (slug, title, intro, body) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title=VALUES(title), intro=VALUES(intro), body=VALUES(body)`,
    [row.slug, row.title, row.intro, row.body]
  );
  return mergeLegalPage(slug, row);
}

export async function getCategoryBannerOverlays() {
  const current = await settingsRow();
  const legal = fromJson(current?.legal_pages, {}) || {};
  return legal[CATEGORY_BANNER_STORE_KEY] || {};
}

export async function persistCategoryBannerOverlay(slug, input) {
  const categorySlug = String(slug || "").trim();
  if (!categorySlug) return;
  const entry = {
    banner: normalizeCategoryBanner(input.banner),
    subcategoryBanners: normalizeSubcategoryBannerMap(input.subcategoryBanners),
  };
  const current = await settingsRow();
  const legal = fromJson(current?.legal_pages, {}) || {};
  legal[CATEGORY_BANNER_STORE_KEY] = {
    ...(legal[CATEGORY_BANNER_STORE_KEY] || {}),
    [categorySlug]: entry,
  };
  await persistLegalPages(legal);
}
