import { AppError, throwIf } from "@/lib/errors";
import { mapCategory } from "@/lib/mappers";
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

export async function getCategories({ includeInactive = false, accessToken } = {}) {
  const supabase = client(accessToken);
  let query = supabase.from("categories").select("*").order("name", { ascending: true });
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  throwIf(error, "Unable to load categories.", 500);
  return (data || []).map(mapCategory);
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
  return category;
}

export async function createCategory(input, accessToken) {
  const supabase = writeClient(accessToken);
  const slug = String(input.slug || "").trim();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      id: input.id || slug,
      name: input.name,
      slug,
      description: input.description || "",
      image: input.image || null,
      image_url: input.image || input.image_url || null,
      subcategories: subcategoryList(input.subcategories),
      is_active: input.isActive !== false,
    })
    .select("*")
    .single();
  throwIf(error, "Unable to create category.");
  return mapCategory(data);
}

export async function getCategoryRecord(id, options = {}) {
  if (!id) return null;
  const supabase = client(options.accessToken);
  const existing = await findCategoryRow(supabase, id);
  throwIf(existing.error, "Unable to load category.", 500);
  const category = mapCategory(existing.data);
  if (category && category.isActive === false && !options.includeInactive) return null;
  return category;
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
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description,
      image: input.image,
      image_url: input.image || input.image_url,
      subcategories: subcategoryList(input.subcategories),
      is_active: input.isActive ?? input.is_active ?? existing.data.is_active,
    })
    .eq("id", existing.data.id)
    .select("*")
    .maybeSingle();
  throwIf(error, "Unable to update category.");
  return mapCategory(data);
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
