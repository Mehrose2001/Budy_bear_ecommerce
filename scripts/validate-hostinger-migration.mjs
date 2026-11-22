import { createClient } from "@supabase/supabase-js";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { loadEnvFiles, reportDir, writeJson } from "./lib/migration-env.mjs";

loadEnvFiles();

function mediaRoot() {
  const configured = String(process.env.MEDIA_ROOT || "").trim();
  if (configured) return path.resolve(configured);
  return path.resolve("storage", "uploads");
}

function collectUrls(value, found) {
  if (typeof value === "string") {
    if (/\/uploads\/|product-images/.test(value)) found.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUrls(item, found));
    return;
  }
  if (value && typeof value === "object") Object.values(value).forEach((item) => collectUrls(item, found));
}

function localExists(url) {
  const marker = "/uploads/";
  const index = String(url).indexOf(marker);
  if (index < 0) return false;
  const relative = decodeURIComponent(String(url).slice(index + marker.length).split(/[?#]/)[0]);
  return fs.existsSync(path.join(mediaRoot(), relative));
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && serviceKey
    ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

const mysqlTables = [
  "users",
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

const report = {
  generatedAt: new Date().toISOString(),
  mediaRoot: mediaRoot(),
  supabaseStillConfigured: Boolean(supabase),
  mysql: {},
  supabase: {},
  missingImages: [],
  productsMissingImages: [],
  remainingSupabaseDependencies: [
    "@supabase/supabase-js",
    "lib/supabase/*",
    "services/* (Supabase path still default while USE_HOSTINGER_BACKEND=false)",
    "backend/src/* Express mirror",
  ],
};

if (supabase) {
  for (const table of ["products", "categories", "orders", "reviews", "profiles", "banners", "coupons"]) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    report.supabase[table] = error ? { error: error.message } : { count };
  }
}

if (process.env.DB_USER && process.env.DB_NAME) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    for (const table of mysqlTables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) AS count FROM ${table}`);
        report.mysql[table] = Number(rows[0].count);
      } catch (error) {
        report.mysql[table] = { error: error.message };
      }
    }
    const [products] = await connection.execute("SELECT id, name, images, color_images FROM products");
    for (const product of products) {
      const found = new Set();
      collectUrls(product.images, found);
      collectUrls(product.color_images, found);
      const missing = [...found].filter((url) => /\/uploads\//.test(url) && !localExists(url));
      if (!found.size) report.productsMissingImages.push({ id: product.id, name: product.name, reason: "no_image_fields" });
      for (const url of missing) report.missingImages.push({ productId: product.id, url });
    }
  } finally {
    await connection.end();
  }
}

writeJson(`${reportDir()}/validation-report.json`, report);
console.log(JSON.stringify(report, null, 2));
