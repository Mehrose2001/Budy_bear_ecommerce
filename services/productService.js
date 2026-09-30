import { AppError, throwIf } from "@/lib/errors";
import { mapProduct, productToRow } from "@/lib/mappers";
import { createServerClient, createUserClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function client(accessToken) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase is not configured.", 503);
  }
  return accessToken ? createUserClient(accessToken) : createServerClient();
}

export async function getProducts({ includeInactive = false, accessToken } = {}) {
  const supabase = client(accessToken);
  let query = supabase.from("products").select("*").order("id", { ascending: true });
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  throwIf(error, "Unable to load products.", 500);
  return (data || []).map(mapProduct);
}

export async function getProductById(id, options = {}) {
  const supabase = client(options.accessToken);
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle();
  throwIf(error, "Unable to load product.", 500);
  const product = mapProduct(data);
  if (product && product.isActive === false && !options.includeInactive) return null;
  return product;
}

export async function getProductBySlug(slug, options = {}) {
  const supabase = client(options.accessToken);
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  throwIf(error, "Unable to load product.", 500);
  const product = mapProduct(data);
  if (product && product.isActive === false && !options.includeInactive) return null;
  return product;
}

export async function createProduct(input, accessToken) {
  const supabase = client(accessToken);
  const row = productToRow(input);
  const { data: nextId, error: seqError } = await supabase.rpc("next_product_id");
  let id = Number(nextId);
  if (seqError || !Number.isFinite(id)) {
    const { data: rows } = await supabase
      .from("products")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);
    id = Number(rows?.[0]?.id || 100) + 1;
  }
  const { data, error } = await supabase
    .from("products")
    .insert({ id, ...row })
    .select("*")
    .single();
  throwIf(error, "Unable to create product.");
  return mapProduct(data);
}

export async function updateProduct(id, input, accessToken) {
  const existing = await getProductById(id, { includeInactive: true, accessToken });
  if (!existing) throw new AppError("Product not found", 404);
  const supabase = client(accessToken);
  const row = productToRow(input, {
    ...existing,
    category_id: existing.category,
    sale_price: existing.salePrice,
    compare_at_price: existing.salePrice,
    color_images: existing.colorImages,
    color_swatches: existing.colorSwatches,
    new_arrival: existing.newArrival,
    best_seller: existing.bestSeller,
    review_count: existing.reviewCount,
    stock_quantity: existing.stock,
    is_featured: existing.featured,
    is_active: existing.isActive,
  });
  const { data, error } = await supabase
    .from("products")
    .update(row)
    .eq("id", Number(id))
    .select("*")
    .single();
  throwIf(error, "Unable to update product.");
  return mapProduct(data);
}

export async function deleteProduct(id, accessToken) {
  const supabase = client(accessToken);
  const { error } = await supabase.from("products").delete().eq("id", Number(id));
  throwIf(error, "Unable to delete product.");
  return true;
}

export async function updateProductStock(id, quantity, accessToken) {
  const stock = Math.max(0, Number(quantity) || 0);
  const supabase = client(accessToken);
  const { data, error } = await supabase
    .from("products")
    .update({ stock, stock_quantity: stock })
    .eq("id", Number(id))
    .select("*")
    .maybeSingle();
  throwIf(error, "Unable to update stock.");
  if (!data) throw new AppError("Product not found", 404);
  return mapProduct(data);
}
