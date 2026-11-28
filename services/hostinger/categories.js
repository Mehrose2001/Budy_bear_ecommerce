import { AppError, throwIf } from "@/lib/errors";
import { query, queryOne } from "@/lib/db";
import { asBool, asJson, normalizeMysqlRow, normalizeMysqlRows } from "@/lib/mysql/helpers";
import { mapCategory } from "@/lib/mappers";
import { entryUrlError, normalizeEntry } from "@/data/seo";
import {
  normalizeCategoryBanner,
  normalizeSubcategoryBannerMap,
  preferStoredBanner,
  preferStoredBannerMap,
} from "@/lib/categoryBanner";
import {
  getCategoryBannerOverlays,
  persistCategoryBannerOverlay,
  removeEntitySeo,
  saveEntitySeo,
} from "@/services/hostinger/content";

function subcategoryList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return subcategoryList(parsed);
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function applyBannerOverlay(category, overlays) {
  if (!category?.slug || !overlays?.[category.slug]) return category;
  const overlay = overlays[category.slug];
  return {
    ...category,
    banner: preferStoredBanner(overlay.banner, category.banner),
    subcategoryBanners: preferStoredBannerMap(
      overlay.subcategoryBanners,
      category.subcategoryBanners
    ),
  };
}

async function withOverlays(categories) {
  const overlays = await getCategoryBannerOverlays();
  return categories.map((category) => applyBannerOverlay(category, overlays));
}

export async function getCategories({ includeInactive = false } = {}) {
  const sql = includeInactive
    ? "SELECT * FROM categories ORDER BY name ASC"
    : "SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC";
  const rows = normalizeMysqlRows(await query(sql)).map(mapCategory).filter(Boolean);
  return withOverlays(rows);
}

export async function getCategoryBySlug(slug, options = {}) {
  const row = normalizeMysqlRow(await queryOne("SELECT * FROM categories WHERE slug = ?", [slug]));
  const category = mapCategory(row);
  if (category && category.isActive === false && !options.includeInactive) return null;
  if (!category) return null;
  const [mapped] = await withOverlays([category]);
  return mapped;
}

async function findCategoryRow(id) {
  const bySlug = await queryOne("SELECT * FROM categories WHERE slug = ?", [id]);
  if (bySlug) return bySlug;
  return queryOne("SELECT * FROM categories WHERE id = ?", [id]);
}

export async function getCategoryRecord(id, options = {}) {
  if (!id) return null;
  const row = normalizeMysqlRow(await findCategoryRow(id));
  const category = mapCategory(row);
  if (category && category.isActive === false && !options.includeInactive) return null;
  if (!category) return null;
  const [mapped] = await withOverlays([category]);
  return mapped;
}

function assertCategorySeo(input) {
  const invalid = entryUrlError(input?.seo, "Category");
  if (invalid) throw new AppError(invalid, 400);
}

export async function createCategory(input) {
  assertCategorySeo(input);
  const slug = String(input.slug || "").trim();
  const id = input.id || slug;
  try {
    await query(
      `INSERT INTO categories (
        id, name, slug, description, image, image_url, subcategories, is_active, seo, subcategory_seo, banner, subcategory_banners
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        slug,
        input.description || "",
        input.image || null,
        input.image || input.image_url || null,
        asJson(subcategoryList(input.subcategories), []),
        asBool(input.isActive !== false),
        asJson(normalizeEntry(input.seo), {}),
        asJson(input.subcategorySeo || input.subcategory_seo || {}, {}),
        asJson(normalizeCategoryBanner(input.banner), {}),
        asJson(normalizeSubcategoryBannerMap(input.subcategoryBanners), {}),
      ]
    );
  } catch (error) {
    throwIf(error, "Unable to create category.");
  }
  if (input.seo) await saveEntitySeo("categories", slug, input.seo);
  await persistCategoryBannerOverlay(slug, input);
  return getCategoryRecord(id, { includeInactive: true });
}

export async function updateCategory(id, input) {
  assertCategorySeo(input);
  const existing = await findCategoryRow(id);
  if (!existing) throw new AppError("Category not found", 404);
  try {
    await query(
      `UPDATE categories SET
        name=?, slug=?, description=?, image=?, image_url=?, subcategories=?, is_active=?,
        seo=?, subcategory_seo=?, banner=?, subcategory_banners=?
      WHERE id=?`,
      [
        input.name,
        input.slug,
        input.description,
        input.image,
        input.image || input.image_url,
        asJson(subcategoryList(input.subcategories), []),
        asBool(input.isActive ?? input.is_active ?? existing.is_active),
        asJson(input.seo !== undefined ? normalizeEntry(input.seo) : existing.seo, {}),
        asJson(input.subcategorySeo || input.subcategory_seo || existing.subcategory_seo, {}),
        asJson(input.banner !== undefined ? normalizeCategoryBanner(input.banner) : existing.banner, {}),
        asJson(
          input.subcategoryBanners !== undefined
            ? normalizeSubcategoryBannerMap(input.subcategoryBanners)
            : existing.subcategory_banners,
          {}
        ),
        existing.id,
      ]
    );
  } catch (error) {
    throwIf(error, "Unable to update category.");
  }
  const savedSlug = input.slug || existing.slug;
  if (input.seo) await saveEntitySeo("categories", savedSlug, input.seo);
  else await removeEntitySeo("categories", savedSlug);
  await persistCategoryBannerOverlay(savedSlug, input);
  return getCategoryRecord(existing.id, { includeInactive: true });
}

export async function deleteCategory(id) {
  const existing = await findCategoryRow(id);
  if (!existing) return true;
  try {
    await query("DELETE FROM categories WHERE id = ?", [existing.id]);
  } catch (error) {
    if (/foreign key|1451/i.test(String(error.message || ""))) {
      throw new AppError("This category still has products. Move those products first, then delete it.", 409);
    }
    throwIf(error, "Unable to delete category.");
  }
  return true;
}
