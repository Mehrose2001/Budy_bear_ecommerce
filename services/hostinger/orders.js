import { invalidateCatalogSnapshot } from "@/lib/catalog";
import { AppError, throwIf } from "@/lib/errors";
import { query, queryOne, withTransaction } from "@/lib/db";
import { asJson, nextId, normalizeMysqlRow, normalizeMysqlRows } from "@/lib/mysql/helpers";
import { mapOrder, toDbOrderStatus, toDbPaymentStatus } from "@/lib/mappers";
import { orderPhone, phonesMatch, toPublicTrackOrder } from "@/lib/orderTracking";
import { importMissingSupabaseOrders } from "@/services/hostinger/importSupabaseOrders";

function withItems(orderRow) {
  if (!orderRow) return null;
  const fallbackItems = (orderRow.order_items || []).map((item) => ({
    productId: item.product_id,
    name: item.product_name,
    unitPrice: Number(item.product_price),
    quantity: Number(item.quantity),
  }));
  return mapOrder(orderRow, orderRow.items?.length ? orderRow.items : fallbackItems);
}

async function loadOrder(id) {
  const row = normalizeMysqlRow(await queryOne("SELECT * FROM orders WHERE id = ?", [id]));
  if (!row) return null;
  const items = normalizeMysqlRows(await query("SELECT * FROM order_items WHERE order_id = ?", [id]));
  return withItems({ ...row, order_items: items });
}

function decrementVariant(product, item, qty) {
  const variants = JSON.parse(JSON.stringify(product.variant_stock || {}));
  const color = String(item.color || "").trim();
  const size = String(item.size || "").trim();
  if (!variants || typeof variants !== "object" || !Object.keys(variants).length || !color) {
    const available = Number(product.stock_quantity ?? product.stock ?? 0);
    if (available < qty) throw new AppError(`${product.name} does not have enough stock.`, 409);
    const next = available - qty;
    return { variant_stock: variants, stock: next, stock_quantity: next };
  }
  const colorKey = Object.keys(variants).find((key) => key.toLowerCase() === color.toLowerCase());
  if (!colorKey) throw new AppError(`${product.name} does not have enough stock.`, 409);
  const sizes = variants[colorKey] || {};
  const sizeKey = Object.keys(sizes).find((key) => key.toLowerCase() === size.toLowerCase());
  if (!sizeKey) throw new AppError(`${product.name} does not have enough stock.`, 409);
  const available = Number(sizes[sizeKey] || 0);
  if (available < qty) throw new AppError(`${product.name} does not have enough stock.`, 409);
  sizes[sizeKey] = available - qty;
  variants[colorKey] = sizes;
  const total = Object.values(variants).reduce((sum, sizeMap) => {
    return sum + Object.values(sizeMap || {}).reduce((inner, value) => inner + Number(value || 0), 0);
  }, 0);
  return { variant_stock: variants, stock: total, stock_quantity: total };
}

export async function createOrder(orderData, orderItems) {
  const items = orderItems || orderData.items || [];
  try {
    const created = await withTransaction(async (connection) => {
      for (const item of items) {
        const productId = Number(item.productId || item.product_id);
        const qty = Math.max(1, Number(item.quantity) || 0);
        const [rows] = await connection.execute(
          "SELECT * FROM products WHERE id = ? FOR UPDATE",
          [productId]
        );
        const product = rows[0];
        if (!product || !Number(product.is_active)) {
          throw new AppError("A product in your cart is no longer available.", 400);
        }
        if (product.variant_stock && typeof product.variant_stock === "string") {
          try {
            product.variant_stock = JSON.parse(product.variant_stock);
          } catch {
            product.variant_stock = {};
          }
        }
        const next = decrementVariant(product, item, qty);
        await connection.execute(
          "UPDATE products SET variant_stock = ?, stock = ?, stock_quantity = ? WHERE id = ?",
          [asJson(next.variant_stock, {}), next.stock, next.stock_quantity, productId]
        );
      }

      const [counterRows] = await connection.execute(
        "SELECT next_value FROM order_counters WHERE name = 'order_number' FOR UPDATE"
      );
      let nextNumber = Number(counterRows[0]?.next_value || 1001);
      await connection.execute("UPDATE order_counters SET next_value = ? WHERE name = 'order_number'", [
        nextNumber + 1,
      ]);
      const orderId = `BB-${nextNumber}`;
      const shipping = Number(orderData.shipping || 0);
      const total = Number(orderData.total);
      const customer = orderData.customer || {};
      const address = orderData.shippingAddress || {};
      const requestedUserId = String(orderData.userId || "").trim();
      let userId = null;
      if (requestedUserId) {
        const [profileRows] = await connection.execute("SELECT id FROM profiles WHERE id = ? LIMIT 1", [
          requestedUserId,
        ]);
        userId = profileRows[0]?.id || null;
      }
      await connection.execute(
        `INSERT INTO orders (
          id, user_id, items, subtotal, discount, shipping, shipping_fee, total, total_amount,
          delivery_method, payment_method, payment_status, order_status, shipping_address,
          shipping_address_text, customer, customer_name, customer_email, customer_phone, city,
          postal_code, notes, coupon_code
        ) VALUES (${Array(23).fill("?").join(", ")})`,
        [
          orderId,
          userId,
          asJson(items, []),
          Number(orderData.subtotal),
          Number(orderData.discount || 0),
          shipping,
          shipping,
          total,
          total,
          orderData.deliveryMethod,
          orderData.paymentMethod || "cod",
          "pending",
          "pending",
          asJson(address, {}),
          [address.address, address.city, address.province, address.postalCode].filter(Boolean).join(", "),
          asJson(customer, {}),
          customer.fullName || null,
          customer.email || null,
          customer.phone || null,
          address.city || null,
          address.postalCode || null,
          orderData.notes || "",
          orderData.couponCode || null,
        ]
      );
      for (const item of items) {
        const linePrice = Number(item.unitPrice ?? item.price ?? 0);
        const qty = Math.max(1, Number(item.quantity) || 1);
        await connection.execute(
          `INSERT INTO order_items (id, order_id, product_id, product_name, product_price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            nextId(),
            orderId,
            item.productId || item.product_id || null,
            item.name || "Product",
            linePrice,
            qty,
            linePrice * qty,
          ]
        );
      }
      return orderId;
    });
    return loadOrder(created);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throwIf(error, error?.message || "Unable to create this order.", /stock/i.test(error?.message) ? 409 : 400);
  }
}

export async function getOrderById(id) {
  return loadOrder(id);
}

export async function trackOrder(orderId, phone) {
  const order = await loadOrder(String(orderId || "").trim());
  if (!order || !phonesMatch(orderPhone(order), phone)) {
    throw new AppError("Order not found.", 404);
  }
  return toPublicTrackOrder(order);
}

export async function getUserOrders(userId) {
  const rows = normalizeMysqlRows(
    await query("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [userId])
  );
  const results = [];
  for (const row of rows) {
    results.push(await loadOrder(row.id));
  }
  return results;
}

export async function getAllOrders() {
  try {
    await importMissingSupabaseOrders();
  } catch (error) {
    console.warn("Supabase order import skipped:", error?.message || error);
  }
  const rows = normalizeMysqlRows(await query("SELECT * FROM orders ORDER BY created_at DESC"));
  const results = [];
  for (const row of rows) {
    try {
      const order = await loadOrder(row.id);
      if (order) results.push(order);
    } catch (error) {
      console.warn(`Skipping unreadable order ${row.id}:`, error?.message || error);
    }
  }
  return results;
}

export async function updateOrderStatus(id, status) {
  const order = await loadOrder(id);
  if (!order) throw new AppError("Order not found", 404);
  const orderStatus = toDbOrderStatus(status);
  let paymentStatus = order.paymentStatus;
  if (orderStatus === "cancelled") paymentStatus = order.paymentMethod === "cod" ? "pending" : "refunded";
  if (orderStatus === "delivered" && order.paymentMethod === "cod") paymentStatus = "paid";
  await query("UPDATE orders SET order_status = ?, payment_status = ? WHERE id = ?", [
    orderStatus,
    toDbPaymentStatus(paymentStatus),
    id,
  ]);
  return loadOrder(id);
}

async function restoreOrderStock(items) {
  for (const item of items || []) {
    const productId = item.productId || item.product_id;
    const qty = Math.max(1, Number(item.quantity) || 1);
    if (!productId) continue;
    const product = await queryOne("SELECT id, variant_stock, stock_quantity, stock FROM products WHERE id = ?", [
      productId,
    ]);
    if (!product) continue;
    let variants = product.variant_stock;
    if (typeof variants === "string") {
      try {
        variants = JSON.parse(variants);
      } catch {
        variants = {};
      }
    }
    variants = variants && typeof variants === "object" ? JSON.parse(JSON.stringify(variants)) : {};
    const color = String(item.color || "").trim();
    const size = String(item.size || "").trim();
    if (Object.keys(variants).length && color) {
      const colorKey = Object.keys(variants).find((key) => key.toLowerCase() === color.toLowerCase());
      const sizes = colorKey ? { ...variants[colorKey] } : null;
      const sizeKey = sizes
        ? Object.keys(sizes).find((key) => key.toLowerCase() === size.toLowerCase())
        : "";
      if (!colorKey || !sizeKey) continue;
      sizes[sizeKey] = Number(sizes[sizeKey] || 0) + qty;
      variants[colorKey] = sizes;
      const total = Object.values(variants).reduce((sum, sizeMap) => {
        return sum + Object.values(sizeMap || {}).reduce((inner, value) => inner + Number(value || 0), 0);
      }, 0);
      await query("UPDATE products SET variant_stock = ?, stock_quantity = ?, stock = ? WHERE id = ?", [
        asJson(variants, {}),
        total,
        total,
        productId,
      ]);
      continue;
    }
    if (Object.keys(variants).length) continue;
    const next = Number(product.stock_quantity ?? product.stock ?? 0) + qty;
    await query("UPDATE products SET stock_quantity = ?, stock = ? WHERE id = ?", [next, next, productId]);
  }
}

export async function deleteOrder(id) {
  const order = await loadOrder(id);
  if (!order) throw new AppError("Order not found", 404);
  await restoreOrderStock(order.items);
  await query("DELETE FROM order_items WHERE order_id = ?", [id]);
  await query("DELETE FROM orders WHERE id = ?", [id]);
  invalidateCatalogSnapshot();
  return true;
}

export async function updatePaymentStatus(id, status) {
  await query("UPDATE orders SET payment_status = ? WHERE id = ?", [toDbPaymentStatus(status), id]);
  const order = await loadOrder(id);
  if (!order) throw new AppError("Order not found", 404);
  return order;
}
