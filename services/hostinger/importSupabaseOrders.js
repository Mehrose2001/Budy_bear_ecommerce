import { query, queryOne } from "@/lib/db";
import { asJson, nextId } from "@/lib/mysql/helpers";
import { createServiceClient } from "@/lib/supabase/server";
import { useHostingerBackend } from "@/lib/backendMode";

let lastImport = { at: 0, result: null };
const IMPORT_COOLDOWN_MS = 60_000;

function customerName(row) {
  return (
    row.customer_name ||
    row.customer?.fullName ||
    row.shipping_address?.fullName ||
    null
  );
}

function customerEmail(row) {
  return row.customer_email || row.customer?.email || null;
}

function customerPhone(row) {
  return row.customer_phone || row.customer?.phone || row.shipping_address?.phone || null;
}

function lineItems(row) {
  if (Array.isArray(row.order_items) && row.order_items.length) {
    return row.order_items.map((item) => ({
      id: item.id || nextId(),
      product_id: item.product_id ?? item.productId ?? null,
      product_name: item.product_name || item.name || "Product",
      product_price: Number(item.product_price ?? item.unitPrice ?? item.price ?? 0),
      quantity: Math.max(1, Number(item.quantity) || 1),
      subtotal: Number(
        item.subtotal ??
          Number(item.product_price ?? item.unitPrice ?? item.price ?? 0) *
            Math.max(1, Number(item.quantity) || 1)
      ),
      created_at: item.created_at || row.created_at || new Date(),
    }));
  }
  if (Array.isArray(row.items) && row.items.length) {
    return row.items.map((item) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const price = Number(item.unitPrice ?? item.price ?? item.product_price ?? 0);
      return {
        id: item.id || nextId(),
        product_id: item.productId ?? item.product_id ?? null,
        product_name: item.name || item.product_name || "Product",
        product_price: price,
        quantity: qty,
        subtotal: price * qty,
        created_at: row.created_at || new Date(),
      };
    });
  }
  return [];
}

async function existingIds(table, column = "id") {
  const rows = await query(`SELECT ${column} AS id FROM ${table}`);
  return new Set((rows || []).map((row) => String(row.id)));
}

async function bumpOrderCounter() {
  await query(
    `UPDATE order_counters
     SET next_value = (
       SELECT COALESCE(MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)), 1000) + 1 FROM orders
     )
     WHERE name = 'order_number'`
  );
}

export async function importMissingSupabaseOrders({ force = false } = {}) {
  if (!useHostingerBackend()) {
    return { imported: 0, skipped: 0, failed: [], reason: "hostinger_backend_off" };
  }
  const now = Date.now();
  if (!force && lastImport.result && now - lastImport.at < IMPORT_COOLDOWN_MS) {
    return lastImport.result;
  }

  const supabase = createServiceClient();
  if (!supabase) {
    const result = { imported: 0, skipped: 0, failed: [], reason: "no_service_role" };
    lastImport = { at: now, result };
    return result;
  }

  let { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: true });
  if (error) {
    const fallback = await supabase.from("orders").select("*").order("created_at", { ascending: true });
    data = fallback.data;
    error = fallback.error;
    if (!error && data?.length) {
      const items = await supabase.from("order_items").select("*");
      const byOrder = new Map();
      for (const item of items.data || []) {
        const list = byOrder.get(item.order_id) || [];
        list.push(item);
        byOrder.set(item.order_id, list);
      }
      data = data.map((row) => ({ ...row, order_items: byOrder.get(row.id) || [] }));
    }
  }
  if (error) {
    const result = { imported: 0, skipped: 0, failed: [], reason: error.message };
    lastImport = { at: now, result };
    return result;
  }

  const haveOrders = await existingIds("orders");
  const productIds = new Set(
    (await query("SELECT id FROM products")).map((row) => Number(row.id))
  );
  const profileIds = await existingIds("profiles");
  const haveItems = await existingIds("order_items");

  let imported = 0;
  let skipped = 0;
  const failed = [];

  for (const row of data || []) {
    if (!row?.id) continue;
    if (haveOrders.has(String(row.id))) {
      skipped += 1;
      continue;
    }
    try {
      const userId = row.user_id && profileIds.has(String(row.user_id)) ? row.user_id : null;
      const items = lineItems(row);
      const shipping = Number(row.shipping_fee ?? row.shipping ?? 0);
      const total = Number(row.total_amount ?? row.total ?? 0);
      await query(
        `INSERT INTO orders (
          id, user_id, items, subtotal, discount, shipping, shipping_fee, total, total_amount,
          delivery_method, payment_method, payment_status, order_status, shipping_address,
          shipping_address_text, customer, customer_name, customer_email, customer_phone, city,
          postal_code, notes, coupon_code, created_at, updated_at
        ) VALUES (${Array(25).fill("?").join(", ")})`,
        [
          row.id,
          userId,
          asJson(row.items?.length ? row.items : items, []),
          Number(row.subtotal || 0),
          Number(row.discount || 0),
          shipping,
          shipping,
          total,
          total,
          row.delivery_method || "standard",
          row.payment_method || "cod",
          row.payment_status || "pending",
          row.order_status || "pending",
          asJson(row.shipping_address, {}),
          row.shipping_address_text || null,
          asJson(row.customer || {
            fullName: customerName(row),
            email: customerEmail(row),
            phone: customerPhone(row),
          }, {}),
          customerName(row),
          customerEmail(row),
          customerPhone(row),
          row.city || row.shipping_address?.city || null,
          row.postal_code || row.shipping_address?.postalCode || null,
          row.notes || "",
          row.coupon_code || null,
          row.created_at || new Date(),
          row.updated_at || row.created_at || new Date(),
        ]
      );
      for (const item of items) {
        if (haveItems.has(String(item.id))) continue;
        const productId = Number(item.product_id);
        await query(
          `INSERT INTO order_items (id, order_id, product_id, product_name, product_price, quantity, subtotal, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            row.id,
            Number.isFinite(productId) && productIds.has(productId) ? productId : null,
            item.product_name,
            item.product_price,
            item.quantity,
            item.subtotal,
            item.created_at,
          ]
        );
      }
      haveOrders.add(String(row.id));
      imported += 1;
    } catch (err) {
      failed.push({ id: row.id, error: err?.message || "insert_failed" });
    }
  }

  if (imported > 0) {
    try {
      await bumpOrderCounter();
    } catch (err) {
      console.warn("Order counter update failed after import:", err?.message || err);
    }
  }

  const result = {
    imported,
    skipped,
    failed,
    supabaseCount: (data || []).length,
    reason: "",
  };
  lastImport = { at: now, result };
  return result;
}

export async function mysqlOrderCount() {
  try {
    const row = await queryOne("SELECT COUNT(*) AS n FROM orders");
    return Number(row?.n || 0);
  } catch {
    return null;
  }
}
