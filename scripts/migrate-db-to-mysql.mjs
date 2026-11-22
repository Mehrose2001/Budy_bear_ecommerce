import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import mysql from "mysql2/promise";
import { arg, loadEnvFiles, reportDir, writeJson } from "./lib/migration-env.mjs";

loadEnvFiles();

const dryRun = !arg("--execute");
const writeSql = arg("--write-sql");
const updateExisting = arg("--update-existing");
const importPasswordHashes = arg("--import-password-hashes");

if (!dryRun && !arg("--confirm-mysql-import")) {
  console.error("Refusing to write MySQL without --execute --confirm-mysql-import. Dry-run only.");
  process.exit(2);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || (!serviceKey && !anonKey)) {
  console.error("A Supabase key is required for a read-only export. No MySQL writes happened.");
  process.exit(1);
}

function makeClient(key) {
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let supabase = makeClient(serviceKey || anonKey);
let usedAnonFallback = false;
{
  const probe = await supabase.from("products").select("id").limit(1);
  if (probe.error && /invalid api key/i.test(probe.error.message || "") && anonKey && anonKey !== serviceKey) {
    supabase = makeClient(anonKey);
    usedAnonFallback = true;
  }
}

function json(value, fallback) {
  if (value == null) return fallback == null ? null : JSON.stringify(fallback);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function bool(value, fallback = 0) {
  if (value == null) return fallback;
  return value ? 1 : 0;
}

async function fetchAll(table, columns = "*") {
  const rows = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function listAuthUsers() {
  const users = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return { users, error: error.message };
    users.push(...(data?.users || []));
    if (!data?.users?.length || data.users.length < 200) break;
  }
  return { users, error: null };
}

const TABLES = [
  "profiles",
  "categories",
  "products",
  "orders",
  "order_items",
  "reviews",
  "wishlists",
  "coupons",
  "banners",
  "store_settings",
  "store_pages",
];

const source = {};
for (const table of TABLES) {
  try {
    source[table] = await fetchAll(table);
  } catch (error) {
    source[table] = [];
    source[`${table}_error`] = error.message;
  }
}
const auth = await listAuthUsers();

const report = {
  generatedAt: new Date().toISOString(),
  dryRun,
  writeSql,
  usedAnonFallback,
  updateExisting,
  importPasswordHashes,
  supabaseReadOnly: true,
  counts: Object.fromEntries(TABLES.map((table) => [table, (source[table] || []).length])),
  tableErrors: Object.fromEntries(
    TABLES.filter((table) => source[`${table}_error`]).map((table) => [table, source[`${table}_error`]])
  ),
  authUsers: auth.users.length,
  authError: auth.error,
  inserted: {},
  skipped: {},
  failed: [],
};

const mysqlConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
};

function sqlLiteral(value) {
  if (value == null || value === "") return typeof value === "string" && value === "" ? "''" : "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  const text = value instanceof Date ? value.toISOString().slice(0, 19).replace("T", " ") : String(value);
  return `'${text.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

function insertIgnore(table, columns, values) {
  return `INSERT IGNORE INTO ${table} (${columns.join(", ")}) VALUES (${values.map(sqlLiteral).join(", ")});`;
}

if (writeSql) {
  const lines = [
    "SET NAMES utf8mb4;",
    "SET FOREIGN_KEY_CHECKS=0;",
    "START TRANSACTION;",
  ];
  const profileIds = new Set((source.profiles || []).map((row) => row.id));
  for (const user of auth.users) {
    const hash = importPasswordHashes ? user.encrypted_password || null : null;
    lines.push(
      insertIgnore(
        "users",
        ["id", "email", "password_hash", "password_algo", "password_needs_reset", "email_confirmed_at", "last_sign_in_at", "raw_user_meta", "created_at"],
        [
          user.id,
          String(user.email || "").toLowerCase(),
          hash,
          hash ? "bcrypt" : null,
          importPasswordHashes && hash ? 0 : 1,
          user.email_confirmed_at || user.confirmed_at || null,
          user.last_sign_in_at || null,
          json(user.user_metadata || {}, {}),
          user.created_at || new Date(),
        ]
      )
    );
  }
  for (const row of source.profiles || []) {
    lines.push(
      insertIgnore("users", ["id", "email", "password_needs_reset", "created_at"], [
        row.id,
        String(row.email || "").toLowerCase(),
        1,
        row.created_at || new Date(),
      ])
    );
    lines.push(
      insertIgnore(
        "profiles",
        ["id", "email", "full_name", "phone", "address", "city", "role", "created_at", "updated_at"],
        [
          row.id,
          String(row.email || "").toLowerCase(),
          row.full_name || null,
          row.phone || null,
          row.address || null,
          row.city || null,
          row.role === "admin" ? "admin" : "customer",
          row.created_at || new Date(),
          row.updated_at || new Date(),
        ]
      )
    );
  }
  for (const row of source.categories || []) {
    lines.push(
      insertIgnore(
        "categories",
        ["id", "name", "slug", "description", "image", "image_url", "subcategories", "is_active", "seo", "subcategory_seo", "banner", "subcategory_banners", "created_at", "updated_at"],
        [
          row.id,
          row.name,
          row.slug,
          row.description || "",
          row.image || null,
          row.image_url || row.image || null,
          json(row.subcategories, []),
          bool(row.is_active ?? true, 1),
          json(row.seo, {}),
          json(row.subcategory_seo, {}),
          json(row.banner, {}),
          json(row.subcategory_banners, {}),
          row.created_at || new Date(),
          row.updated_at || new Date(),
        ]
      )
    );
  }
  for (const row of source.products || []) {
    lines.push(
      insertIgnore(
        "products",
        [
          "id", "name", "slug", "description", "category_id", "subcategory", "subcategories", "price", "sale_price", "compare_at_price",
          "sku", "images", "color_images", "color_swatches", "sizes", "colors", "variant_stock", "stock", "stock_quantity", "rating",
          "review_count", "brand", "featured", "is_featured", "new_arrival", "best_seller", "is_active", "seo", "created_at", "updated_at",
        ],
        [
          row.id, row.name, row.slug, row.description || "", row.category_id, row.subcategory || "", json(row.subcategories, []),
          row.price, row.sale_price, row.compare_at_price, row.sku ? row.sku : null, json(row.images, []), json(row.color_images, []),
          json(row.color_swatches, {}), json(row.sizes, []), json(row.colors, []), json(row.variant_stock, {}),
          row.stock || 0, row.stock_quantity ?? row.stock ?? 0, row.rating || 0, row.review_count || 0, row.brand || "Budy Bear",
          bool(row.featured), bool(row.is_featured ?? row.featured), bool(row.new_arrival), bool(row.best_seller),
          bool(row.is_active ?? true, 1), json(row.seo, {}), row.created_at || new Date(), row.updated_at || new Date(),
        ]
      )
    );
  }
  for (const row of source.reviews || []) {
    lines.push(
      insertIgnore(
        "reviews",
        ["id", "product_id", "product_name", "author", "customer_name", "user_id", "rating", "title", "comment", "status", "is_approved", "is_testimonial", "created_at", "updated_at"],
        [
          row.id, row.product_id, row.product_name || null, row.author, row.customer_name || row.author,
          row.user_id && profileIds.has(row.user_id) ? row.user_id : null, row.rating, row.title || "", row.comment || "",
          row.status || "Pending", bool(row.is_approved), bool(row.is_testimonial), row.created_at || new Date(), row.updated_at || new Date(),
        ]
      )
    );
  }
  for (const row of source.coupons || []) {
    lines.push(
      insertIgnore(
        "coupons",
        ["id", "code", "label", "discount_percent", "min_order", "active", "created_at", "updated_at"],
        [row.id, row.code, row.label, row.discount_percent, row.min_order || 0, bool(row.active ?? true, 1), row.created_at || new Date(), row.updated_at || new Date()]
      )
    );
  }
  for (const row of source.banners || []) {
    lines.push(
      insertIgnore(
        "banners",
        ["id", "title", "image", "mobile_image", "href", "active", "created_at", "updated_at"],
        [row.id, row.title, row.image, row.mobile_image || null, row.href || "/products", bool(row.active ?? true, 1), row.created_at || new Date(), row.updated_at || new Date()]
      )
    );
  }
  for (const row of source.store_settings || []) {
    lines.push(
      `INSERT INTO store_settings (id, store_name, announcement, support_email, support_phone, seasonal_collection, legal_pages, offer, seasonal_banner, seo, delivery_fee, free_delivery_threshold)
       VALUES (${[
         row.id || 1, row.store_name || "Budy Bear", row.announcement || "", row.support_email || "support@budybear.com",
         row.support_phone || "", row.seasonal_collection || "winter", json(row.legal_pages, {}), json(row.offer, {}),
         json(row.seasonal_banner, {}), json(row.seo, {}), row.delivery_fee ?? null, row.free_delivery_threshold ?? null,
       ].map(sqlLiteral).join(", ")})
       ON DUPLICATE KEY UPDATE store_name=VALUES(store_name), announcement=VALUES(announcement), offer=VALUES(offer), seasonal_banner=VALUES(seasonal_banner), seo=VALUES(seo);`
    );
  }
  for (const row of source.store_pages || []) {
    lines.push(
      insertIgnore(
        "store_pages",
        ["slug", "title", "intro", "body", "updated_at"],
        [row.slug, row.title, row.intro || "", row.body || "", row.updated_at || new Date()]
      )
    );
  }
  for (const row of source.orders || []) {
    lines.push(
      insertIgnore(
        "orders",
        [
          "id", "user_id", "items", "subtotal", "discount", "shipping", "shipping_fee", "total", "total_amount", "delivery_method",
          "payment_method", "payment_status", "order_status", "shipping_address", "shipping_address_text", "customer",
          "customer_name", "customer_email", "customer_phone", "city", "postal_code", "notes", "coupon_code", "created_at", "updated_at",
        ],
        [
          row.id, row.user_id && profileIds.has(row.user_id) ? row.user_id : null, json(row.items, []), row.subtotal,
          row.discount || 0, row.shipping || 0, row.shipping_fee ?? row.shipping ?? 0, row.total, row.total_amount ?? row.total,
          row.delivery_method, row.payment_method || "cod", row.payment_status || "pending", row.order_status || "pending",
          json(row.shipping_address, {}), row.shipping_address_text || null, json(row.customer, {}), row.customer_name || null,
          row.customer_email || null, row.customer_phone || null, row.city || null, row.postal_code || null, row.notes || "",
          row.coupon_code || null, row.created_at || new Date(), row.updated_at || new Date(),
        ]
      )
    );
  }
  for (const row of source.order_items || []) {
    lines.push(
      insertIgnore(
        "order_items",
        ["id", "order_id", "product_id", "product_name", "product_price", "quantity", "subtotal", "created_at"],
        [row.id, row.order_id, row.product_id, row.product_name, row.product_price, row.quantity, row.subtotal, row.created_at || new Date()]
      )
    );
  }
  lines.push("UPDATE order_counters SET next_value = (SELECT COALESCE(MAX(id), 99) + 1 FROM products) WHERE name = 'product_id';");
  lines.push("UPDATE order_counters SET next_value = (SELECT COALESCE(MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)), 1000) + 1 FROM orders) WHERE name = 'order_number';");
  lines.push("SET FOREIGN_KEY_CHECKS=1;");
  lines.push("COMMIT;");
  const sqlPath = path.join(reportDir(), "hostinger-import.sql");
  fs.writeFileSync(sqlPath, `${lines.join("\n")}\n`);
  report.sqlFile = sqlPath;
  report.sqlStatements = lines.length;
  report.note =
    "Wrote phpMyAdmin SQL dump. Hostinger MySQL is localhost-only, so import this file in phpMyAdmin. Production remains on Supabase until USE_HOSTINGER_BACKEND=true.";
  writeJson(`${reportDir()}/db-migration-report.json`, report);
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

if (dryRun) {
  report.note =
    "Dry-run only. Re-run with --write-sql to generate phpMyAdmin SQL, or --execute --confirm-mysql-import if MySQL is reachable. Existing MySQL rows are never overwritten unless --update-existing is also passed.";
  writeJson(`${reportDir()}/db-migration-report.json`, report);
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

if (!mysqlConfig.user || !mysqlConfig.database) {
  console.error("MySQL is not configured.");
  process.exit(1);
}

const connection = await mysql.createConnection(mysqlConfig);

async function exists(sql, params) {
  const [rows] = await connection.execute(sql, params);
  return Boolean(rows[0]);
}

async function insert(table, sql, params, id) {
  try {
    if (!updateExisting) {
      const [rows] = await connection.execute(`SELECT 1 AS ok FROM ${table} WHERE ${id.column} = ? LIMIT 1`, [
        id.value,
      ]);
      if (rows[0]) {
        report.skipped[table] = (report.skipped[table] || 0) + 1;
        return "skipped";
      }
    }
    await connection.execute(sql, params);
    report.inserted[table] = (report.inserted[table] || 0) + 1;
    return "inserted";
  } catch (error) {
    report.failed.push({ table, id: id.value, error: error.message });
    return "failed";
  }
}

try {
  const profileIds = new Set((source.profiles || []).map((row) => row.id));
  for (const user of auth.users) {
    const hash = importPasswordHashes ? user.encrypted_password || null : null;
    const needsReset = importPasswordHashes && hash ? 0 : 1;
    await insert(
      "users",
      `INSERT INTO users (id, email, password_hash, password_algo, password_needs_reset, email_confirmed_at, last_sign_in_at, raw_user_meta, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE email=IF(VALUES(email) IS NULL, email, email)`,
      [
        user.id,
        String(user.email || "").toLowerCase(),
        hash,
        hash ? "bcrypt" : null,
        needsReset,
        user.email_confirmed_at || user.confirmed_at || null,
        user.last_sign_in_at || null,
        json(user.user_metadata || {}, {}),
        user.created_at || new Date(),
      ],
      { column: "id", value: user.id }
    );
  }

  for (const row of source.profiles || []) {
    if (!(await exists("SELECT id FROM users WHERE id = ?", [row.id]))) {
      await insert(
        "users",
        `INSERT INTO users (id, email, password_needs_reset, created_at) VALUES (?, ?, 1, ?)`,
        [row.id, String(row.email || "").toLowerCase(), row.created_at || new Date()],
        { column: "id", value: row.id }
      );
    }
    await insert(
      "profiles",
      `INSERT INTO profiles (id, email, full_name, phone, address, city, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        String(row.email || "").toLowerCase(),
        row.full_name || null,
        row.phone || null,
        row.address || null,
        row.city || null,
        row.role === "admin" ? "admin" : "customer",
        row.created_at || new Date(),
        row.updated_at || new Date(),
      ],
      { column: "id", value: row.id }
    );
    profileIds.add(row.id);
  }

  for (const row of source.categories || []) {
    await insert(
      "categories",
      `INSERT INTO categories (id, name, slug, description, image, image_url, subcategories, is_active, seo, subcategory_seo, banner, subcategory_banners, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.name,
        row.slug,
        row.description || "",
        row.image || null,
        row.image_url || row.image || null,
        json(row.subcategories, []),
        bool(row.is_active ?? true, 1),
        json(row.seo, {}),
        json(row.subcategory_seo, {}),
        json(row.banner, {}),
        json(row.subcategory_banners, {}),
        row.created_at || new Date(),
        row.updated_at || new Date(),
      ],
      { column: "id", value: row.id }
    );
  }

  for (const row of source.products || []) {
    await insert(
      "products",
      `INSERT INTO products (
        id, name, slug, description, category_id, subcategory, subcategories, price, sale_price, compare_at_price,
        sku, images, color_images, color_swatches, sizes, colors, variant_stock, stock, stock_quantity, rating,
        review_count, brand, featured, is_featured, new_arrival, best_seller, is_active, seo, created_at, updated_at
      ) VALUES (${Array(30).fill("?").join(", ")})`,
      [
        row.id,
        row.name,
        row.slug,
        row.description || "",
        row.category_id,
        row.subcategory || "",
        json(row.subcategories, []),
        row.price,
        row.sale_price,
        row.compare_at_price,
        row.sku ? row.sku : null,
        json(row.images, []),
        json(row.color_images, []),
        json(row.color_swatches, {}),
        json(row.sizes, []),
        json(row.colors, []),
        json(row.variant_stock, {}),
        row.stock || 0,
        row.stock_quantity ?? row.stock ?? 0,
        row.rating || 0,
        row.review_count || 0,
        row.brand || "Budy Bear",
        bool(row.featured),
        bool(row.is_featured ?? row.featured),
        bool(row.new_arrival),
        bool(row.best_seller),
        bool(row.is_active ?? true, 1),
        json(row.seo, {}),
        row.created_at || new Date(),
        row.updated_at || new Date(),
      ],
      { column: "id", value: row.id }
    );
  }

  for (const row of source.orders || []) {
    const userId = row.user_id && profileIds.has(row.user_id) ? row.user_id : null;
    await insert(
      "orders",
      `INSERT INTO orders (
        id, user_id, items, subtotal, discount, shipping, shipping_fee, total, total_amount, delivery_method,
        payment_method, payment_status, order_status, shipping_address, shipping_address_text, customer,
        customer_name, customer_email, customer_phone, city, postal_code, notes, coupon_code, created_at, updated_at
      ) VALUES (${Array(25).fill("?").join(", ")})`,
      [
        row.id,
        userId,
        json(row.items, []),
        row.subtotal,
        row.discount || 0,
        row.shipping || 0,
        row.shipping_fee ?? row.shipping ?? 0,
        row.total,
        row.total_amount ?? row.total,
        row.delivery_method,
        row.payment_method || "cod",
        row.payment_status || "pending",
        row.order_status || "pending",
        json(row.shipping_address, {}),
        row.shipping_address_text || null,
        json(row.customer, {}),
        row.customer_name || null,
        row.customer_email || null,
        row.customer_phone || null,
        row.city || null,
        row.postal_code || null,
        row.notes || "",
        row.coupon_code || null,
        row.created_at || new Date(),
        row.updated_at || new Date(),
      ],
      { column: "id", value: row.id }
    );
  }

  for (const row of source.order_items || []) {
    await insert(
      "order_items",
      `INSERT INTO order_items (id, order_id, product_id, product_name, product_price, quantity, subtotal, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.order_id,
        row.product_id,
        row.product_name,
        row.product_price,
        row.quantity,
        row.subtotal,
        row.created_at || new Date(),
      ],
      { column: "id", value: row.id }
    );
  }

  for (const row of source.reviews || []) {
    await insert(
      "reviews",
      `INSERT INTO reviews (id, product_id, product_name, author, customer_name, user_id, rating, title, comment, status, is_approved, is_testimonial, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.product_id,
        row.product_name || null,
        row.author,
        row.customer_name || row.author,
        row.user_id && profileIds.has(row.user_id) ? row.user_id : null,
        row.rating,
        row.title || "",
        row.comment || "",
        row.status || "Pending",
        bool(row.is_approved),
        bool(row.is_testimonial),
        row.created_at || new Date(),
        row.updated_at || new Date(),
      ],
      { column: "id", value: row.id }
    );
  }

  for (const row of source.wishlists || []) {
    if (!profileIds.has(row.user_id)) continue;
    await insert(
      "wishlists",
      "INSERT IGNORE INTO wishlists (user_id, product_id, created_at) VALUES (?, ?, ?)",
      [row.user_id, row.product_id, row.created_at || new Date()],
      { column: "user_id", value: `${row.user_id}:${row.product_id}` }
    );
  }

  for (const row of source.coupons || []) {
    await insert(
      "coupons",
      `INSERT INTO coupons (id, code, label, discount_percent, min_order, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.code,
        row.label,
        row.discount_percent,
        row.min_order || 0,
        bool(row.active ?? true, 1),
        row.created_at || new Date(),
        row.updated_at || new Date(),
      ],
      { column: "id", value: row.id }
    );
  }

  for (const row of source.banners || []) {
    await insert(
      "banners",
      `INSERT INTO banners (id, title, image, mobile_image, href, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.title,
        row.image,
        row.mobile_image || null,
        row.href || "/products",
        bool(row.active ?? true, 1),
        row.created_at || new Date(),
        row.updated_at || new Date(),
      ],
      { column: "id", value: row.id }
    );
  }

  for (const row of source.store_settings || []) {
    const already = await exists("SELECT id FROM store_settings WHERE id = ?", [row.id || 1]);
    if (already && !updateExisting) {
      report.skipped.store_settings = (report.skipped.store_settings || 0) + 1;
      continue;
    }
    await connection.execute(
      `INSERT INTO store_settings (
        id, store_name, announcement, support_email, support_phone, seasonal_collection, legal_pages, offer,
        seasonal_banner, seo, delivery_fee, free_delivery_threshold
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE store_name=VALUES(store_name)`,
      [
        row.id || 1,
        row.store_name || "Budy Bear",
        row.announcement || "",
        row.support_email || "support@budybear.com",
        row.support_phone || "",
        row.seasonal_collection || "winter",
        json(row.legal_pages, {}),
        json(row.offer, {}),
        json(row.seasonal_banner, {}),
        json(row.seo, {}),
        row.delivery_fee ?? null,
        row.free_delivery_threshold ?? null,
      ]
    );
    report.inserted.store_settings = (report.inserted.store_settings || 0) + 1;
  }

  for (const row of source.store_pages || []) {
    await insert(
      "store_pages",
      `INSERT INTO store_pages (slug, title, intro, body, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [row.slug, row.title, row.intro || "", row.body || "", row.updated_at || new Date()],
      { column: "slug", value: row.slug }
    );
  }

  const [maxProduct] = await connection.execute("SELECT COALESCE(MAX(id), 99) + 1 AS next_id FROM products");
  const [maxOrder] = await connection.execute(
    "SELECT COALESCE(MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)), 1000) + 1 AS next_id FROM orders"
  );
  await connection.execute("UPDATE order_counters SET next_value = ? WHERE name = 'product_id'", [
    maxProduct[0].next_id,
  ]);
  await connection.execute("UPDATE order_counters SET next_value = ? WHERE name = 'order_number'", [
    maxOrder[0].next_id,
  ]);
} finally {
  await connection.end();
}

writeJson(`${reportDir()}/db-migration-report.json`, report);
console.log(JSON.stringify(report, null, 2));
if (report.failed.length) process.exit(1);
