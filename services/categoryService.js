import { AppError, throwIf } from "@/lib/errors";
import { mapCategory } from "@/lib/mappers";
import { isMissingColumn, normalizeEntry } from "@/data/seo";
import {
  getCategoryBannerOverlays,
  persistCategoryBannerOverlay,
  removeEntitySeo,
  saveEntitySeo,
} from "@/services/contentService";
import {
  normalizeCategoryBanner,
  normalizeSubcategoryBannerMap,
} from "@/lib/categoryBanner";
import { createServerClient, createServiceClient, createUserClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function client(accessToken) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase is not configured.", 503);
  }
  return accessToken ? createUserClient(accessToken) : createServerClient();
}

function writeClient(accessToken) {
  return createServiceClient() || client(accessToken);
}

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
    banner: overlay.banner || category.banner,
    subcategoryBanners: overlay.subcategoryBanners || category.subcategoryBanners,
  };
}

export async function getCategories({ includeInactive = false, accessToken } = {}) {
  const supabase = client(accessToken);
  let query = supabase.from("categories").select("*").order("name", { ascending: true });
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  throwIf(error, "Unable to load categories.", 500);
  let overlays = {};
  try {
    overlays = await getCategoryBannerOverlays(accessToken);
  } catch {
    overlays = {};
  }
  return (data || []).map(mapCategory).filter(Boolean).map((category) => applyBannerOverlay(category, overlays));
}

export async function getCategoryBySlug(slug, options = {}) {
  const supabase = client(options.accessToken);
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  throwIf(error, "Unable to load category.", 500);
  const category = mapCategory(data);
  if (category && category.isActive === false && !options.includeInactive) return null;
  if (!category) return null;
  let overlays = {};
  try {
    overlays = await getCategoryBannerOverlays(options.accessToken);
  } catch {
    overlays = {};
  }
  return applyBannerOverlay(category, overlays);
}

function categorySeoFields(input) {
  const fields = {};
  if (input.seo !== undefined) fields.seo = normalizeEntry(input.seo);
  if (input.subcategorySeo !== undefined || input.subcategory_seo !== undefined) {
    fields.subcategory_seo = input.subcategorySeo || input.subcategory_seo || {};
  }
  return fields;
}

function categoryBannerFields(input) {
  const fields = {};
  if (input.banner !== undefined) fields.banner = normalizeCategoryBanner(input.banner);
  if (input.subcategoryBanners !== undefined) {
    fields.subcategory_banners = normalizeSubcategoryBannerMap(input.subcategoryBanners);
  }
  return fields;
}

async function writeCategory(supabase, values, mode, id) {
  let payload = { ...values };
  const run = () =>
    mode === "insert"
      ? supabase.from("categories").insert(payload).select("*").single()
      : supabase.from("categories").update(payload).eq("id", id).select("*").maybeSingle();
  let result = await run();
  let storedSeparately = false;
  let storedBannersSeparately = false;
  const bannerPayload = {
    banner: payload.banner,
    subcategory_banners: payload.subcategory_banners,
  };
  if (isMissingColumn(result.error, "seo") || isMissingColumn(result.error, "subcategory_seo")) {
    delete payload.seo;
    delete payload.subcategory_seo;
    result = await run();
    storedSeparately = true;
  }
  if (
    isMissingColumn(result.error, "banner") ||
    isMissingColumn(result.error, "subcategory_banners")
  ) {
    delete payload.banner;
    delete payload.subcategory_banners;
    result = await run();
    storedBannersSeparately = true;
  }
  return { ...result, storedSeparately, storedBannersSeparately, bannerPayload };
}

async function clearCategoryEntities(input, accessToken, slug) {
  if (input.seo !== undefined) await removeEntitySeo("categories", slug, accessToken);
  const map = input.subcategorySeo || input.subcategory_seo;
  if (!map || typeof map !== "object") return;
  for (const key of Object.keys(map)) {
    await removeEntitySeo("subcategories", `${slug}/${key}`, accessToken);
  }
}

async function storeCategoryEntities(input, accessToken, slug) {
  if (input.seo !== undefined) await saveEntitySeo("categories", slug, input.seo, accessToken);
  const map = input.subcategorySeo || input.subcategory_seo;
  if (!map || typeof map !== "object") return;
  for (const [key, entry] of Object.entries(map)) {
    await saveEntitySeo("subcategories", `${slug}/${key}`, entry, accessToken);
  }
}

export async function createCategory(input, accessToken) {
  const supabase = writeClient(accessToken);
  const slug = String(input.slug || "").trim();
  const result = await writeCategory(
    supabase,
    {
      id: input.id || slug,
      name: input.name,
      slug,
      description: input.description || "",
      image: input.image || null,
      image_url: input.image || input.image_url || null,
      subcategories: subcategoryList(input.subcategories),
      is_active: input.isActive !== false,
      ...categorySeoFields(input),
      ...categoryBannerFields(input),
    },
    "insert"
  );
  throwIf(result.error, "Unable to create category.");
  if (result.storedSeparately) await storeCategoryEntities(input, accessToken, slug);
  else await clearCategoryEntities(input, accessToken, slug);
  if (result.storedBannersSeparately) {
    await persistCategoryBannerOverlay(slug, input, accessToken);
  }
  return applyBannerOverlay(mapCategory(result.data), {
    [slug]: {
      banner: normalizeCategoryBanner(input.banner),
      subcategoryBanners: normalizeSubcategoryBannerMap(input.subcategoryBanners),
    },
  });
}

export async function getCategoryRecord(id, options = {}) {
  if (!id) return null;
  const supabase = client(options.accessToken);
  const existing = await findCategoryRow(supabase, id);
  throwIf(existing.error, "Unable to load category.", 500);
  const category = mapCategory(existing.data);
  if (category && category.isActive === false && !options.includeInactive) return null;
  if (!category) return null;
  let overlays = {};
  try {
    overlays = await getCategoryBannerOverlays(options.accessToken);
  } catch {
    overlays = {};
  }
  return applyBannerOverlay(category, overlays);
}

async function findCategoryRow(supabase, id) {
  const bySlug = await supabase.from("categories").select("*").eq("slug", id).maybeSingle();
  if (bySlug.data) return bySlug;
  return supabase.from("categories").select("*").eq("id", id).maybeSingle();
}

export async function updateCategory(id, input, accessToken) {
  const supabase = writeClient(accessToken);
  const existing = await findCategoryRow(supabase, id);
  throwIf(existing.error, "Unable to update category.");
  if (!existing.data) throw new AppError("Category not found", 404);
  const result = await writeCategory(
    supabase,
    {
      name: input.name,
      slug: input.slug,
      description: input.description,
      image: input.image,
      image_url: input.image || input.image_url,
      subcategories: subcategoryList(input.subcategories),
      is_active: input.isActive ?? input.is_active ?? existing.data.is_active,
      ...categorySeoFields(input),
      ...categoryBannerFields(input),
    },
    "update",
    existing.data.id
  );
  throwIf(result.error, "Unable to update category.");
  const savedSlug = input.slug || existing.data.slug;
  if (result.storedSeparately) await storeCategoryEntities(input, accessToken, savedSlug);
  else await clearCategoryEntities(input, accessToken, savedSlug);
  if (result.storedBannersSeparately) {
    await persistCategoryBannerOverlay(savedSlug, input, accessToken);
  }
  const mapped = mapCategory(result.data);
  return applyBannerOverlay(mapped, {
    [savedSlug]: {
      banner: normalizeCategoryBanner(input.banner ?? mapped?.banner),
      subcategoryBanners: normalizeSubcategoryBannerMap(
        input.subcategoryBanners ?? mapped?.subcategoryBanners
      ),
    },
  });
}

export async function deleteCategory(id, accessToken) {
  const supabase = writeClient(accessToken);
  const existing = await findCategoryRow(supabase, id);
  throwIf(existing.error, "Unable to delete category.");
  if (!existing.data) return true;
  const { error } = await supabase.from("categories").delete().eq("id", existing.data.id);
  if (error && /foreign key|23503/i.test(`${error.message} ${error.code}`)) {
    throw new AppError("This category still has products. Move those products first, then delete it.", 409);
  }
  throwIf(error, "Unable to delete category.");
  return true;
}
