import { AppError, throwIf } from "@/lib/errors";
import { query, queryOne, withTransaction } from "@/lib/db";
import { asBool, asJson, nextId, normalizeMysqlRow, normalizeMysqlRows } from "@/lib/mysql/helpers";
import { mapProduct, productToRow } from "@/lib/mappers";
import { entryUrlError } from "@/data/seo";
import { mergeProductReviewStats } from "@/lib/ratings";
import { saveEntitySeo } from "@/services/hostinger/content";
import { loadPublicReviewStatsMap } from "@/services/hostinger/reviews";

async function nextProductId() {
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT next_value FROM order_counters WHERE name = 'product_id' FOR UPDATE"
    );
    let next = Number(rows[0]?.next_value || 100);
    const [maxRows] = await connection.execute("SELECT COALESCE(MAX(id), 99) AS max_id FROM products");
    next = Math.max(next, Number(maxRows[0]?.max_id || 99) + 1);
    await connection.execute("UPDATE order_counters SET next_value = ? WHERE name = 'product_id'", [next + 1]);
    return next;
  });
}

function productValues(id, row) {
  return [
    id,
    row.name,
    row.slug,
    row.description || "",
    row.category_id,
    row.subcategory || "",
    asJson(row.subcategories, []),
    Number(row.price || 0),
    row.sale_price,
    row.compare_at_price,
    row.sku || null,
    asJson(row.images, []),
    asJson(row.color_images, []),
    asJson(row.color_swatches, {}),
    asJson(row.sizes, []),
    asJson(row.colors, []),
    asJson(row.variant_stock, {}),
    Number(row.stock || 0),
    Number(row.stock_quantity ?? row.stock ?? 0),
    Number(row.rating || 0),
    Number(row.review_count || 0),
    row.brand || "Budy Bear",
    asBool(row.featured),
    asBool(row.is_featured ?? row.featured),
    asBool(row.new_arrival),
    asBool(row.best_seller),
    asBool(row.is_active ?? true),
    asJson(row.seo, {}),
  ];
}

async function withStats(products) {
  const statsMap = await loadPublicReviewStatsMap();
  return products.map((product) => mergeProductReviewStats(product, statsMap));
}

export async function getProducts({ includeInactive = false } = {}) {
  const sql = includeInactive
    ? "SELECT * FROM products ORDER BY id ASC"
    : "SELECT * FROM products WHERE is_active = 1 ORDER BY id ASC";
  const rows = normalizeMysqlRows(await query(sql));
  return withStats(rows.map(mapProduct).filter(Boolean));
}

export async function getProductById(id, options = {}) {
  const row = normalizeMysqlRow(await queryOne("SELECT * FROM products WHERE id = ?", [Number(id)]));
  const product = mapProduct(row);
  if (product && product.isActive === false && !options.includeInactive) return null;
  return product;
}

export async function getRelatedProducts(product, limit = 8) {
  if (!product) return [];
  const rows = normalizeMysqlRows(
    await query(
      `SELECT * FROM products WHERE is_active = 1 AND category_id = ? AND id <> ? LIMIT ${Math.max(
        1,
        Math.min(50, Number(limit) || 8)
      )}`,
      [product.category, Number(product.id)]
    )
  );
  return withStats(rows.map(mapProduct).filter(Boolean));
}

export async function getProductBySlug(slug, options = {}) {
  const row = normalizeMysqlRow(await queryOne("SELECT * FROM products WHERE slug = ?", [slug]));
  const product = mapProduct(row);
  if (product && product.isActive === false && !options.includeInactive) return null;
  if (!product) return null;
  const [mapped] = await withStats([product]);
  return mapped;
}

export async function createProduct(input) {
  const invalidSeo = entryUrlError(input?.seo, "Product");
  if (invalidSeo) throw new AppError(invalidSeo, 400);
  const row = productToRow(input);
  const id = await nextProductId();
  try {
    await query(
      `INSERT INTO products (
        id, name, slug, description, category_id, subcategory, subcategories, price, sale_price,
        compare_at_price, sku, images, color_images, color_swatches, sizes, colors, variant_stock,
        stock, stock_quantity, rating, review_count, brand, featured, is_featured, new_arrival,
        best_seller, is_active, seo
      ) VALUES (${Array(28).fill("?").join(", ")})`,
      productValues(id, row)
    );
  } catch (error) {
    throwIf(error, "Unable to create product.");
  }
  if (input.seo) await saveEntitySeo("products", row.slug, input.seo);
  const created = await getProductById(id, { includeInactive: true });
  return created;
}

export async function updateProduct(id, input) {
  const invalidSeo = entryUrlError(input?.seo, "Product");
  if (invalidSeo) throw new AppError(invalidSeo, 400);
  const existing = await getProductById(id, { includeInactive: true });
  if (!existing) throw new AppError("Product not found", 404);
  const row = productToRow(input, {
    ...existing,
    category_id: existing.category,
    sale_price: existing.salePrice,
    compare_at_price: existing.salePrice,
    color_images: existing.colorImages,
    color_swatches: existing.colorSwatches,
    variant_stock: existing.variantStock,
    new_arrival: existing.newArrival,
    best_seller: existing.bestSeller,
    review_count: existing.reviewCount,
    stock_quantity: existing.stock,
    is_featured: existing.featured,
    is_active: existing.isActive,
  });
  const values = productValues(Number(id), row);
  values.shift();
  try {
    await query(
      `UPDATE products SET
        name=?, slug=?, description=?, category_id=?, subcategory=?, subcategories=?, price=?, sale_price=?,
        compare_at_price=?, sku=?, images=?, color_images=?, color_swatches=?, sizes=?, colors=?, variant_stock=?,
        stock=?, stock_quantity=?, rating=?, review_count=?, brand=?, featured=?, is_featured=?, new_arrival=?,
        best_seller=?, is_active=?, seo=?
      WHERE id=?`,
      [...values, Number(id)]
    );
  } catch (error) {
    throwIf(error, "Unable to update product.");
  }
  if (input.seo) await saveEntitySeo("products", row.slug, input.seo);
  return getProductById(id, { includeInactive: true });
}

export async function deleteProduct(id) {
  try {
    await query("DELETE FROM products WHERE id = ?", [Number(id)]);
  } catch (error) {
    throwIf(error, "Unable to delete product.");
  }
  return true;
}

export async function updateProductStock(id, quantity) {
  const stock = Math.max(0, Number(quantity) || 0);
  await query("UPDATE products SET stock = ?, stock_quantity = ? WHERE id = ?", [stock, stock, Number(id)]);
  const product = await getProductById(id, { includeInactive: true });
  if (!product) throw new AppError("Product not found", 404);
  return product;
}

