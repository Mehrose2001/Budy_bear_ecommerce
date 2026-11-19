import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-images";
const REPORT_DIR = path.join("scripts", "migration-reports");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv(".env.local");
loadEnv("backend/.env");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Supabase service role is not configured.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function isFolder(item) {
  return item.id == null && item.metadata == null;
}

async function listFolder(prefix) {
  const items = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`${prefix || "/"}: ${error.message}`);
    if (!data?.length) break;
    items.push(...data);
    if (data.length < 100) break;
    offset += data.length;
  }
  return items;
}

async function walk(prefix, files) {
  const items = await listFolder(prefix);
  for (const item of items) {
    const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (isFolder(item)) {
      await walk(objectPath, files);
      continue;
    }
    files.push({
      path: objectPath,
      name: item.name,
      size: Number(item.metadata?.size || 0),
      mimetype: item.metadata?.mimetype || "",
      placeholder: item.name === ".emptyFolderPlaceholder",
    });
  }
}

function collectUrls(value, found) {
  if (typeof value === "string") {
    if (value.includes("supabase.co/storage")) found.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUrls(item, found));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectUrls(item, found));
  }
}

async function scanTable(table, columns) {
  const { data, error } = await supabase.from(table).select(columns);
  if (error) return { table, error: error.message, rows: 0, urls: 0 };
  const urls = new Set();
  for (const row of data || []) collectUrls(row, urls);
  return { table, rows: (data || []).length, urls: urls.size, columns };
}

const files = [];
await walk("", files);
const realFiles = files.filter((file) => !file.placeholder);
const byFolder = {};
for (const file of realFiles) {
  const folder = file.path.split("/")[0] || "(root)";
  const entry = byFolder[folder] || { files: 0, bytes: 0 };
  entry.files += 1;
  entry.bytes += file.size;
  byFolder[folder] = entry;
}

const tables = await Promise.all([
  scanTable("products", "id, images, color_images, seo"),
  scanTable("categories", "id, image_url, banner, subcategory_banners, seo, subcategory_seo"),
  scanTable("banners", "id, image, mobile_image"),
  scanTable("store_settings", "id, legal_pages, seo, seasonal_banner"),
]);

const report = {
  generatedAt: new Date().toISOString(),
  bucket: BUCKET,
  totalListed: files.length,
  placeholders: files.filter((file) => file.placeholder).length,
  mediaFiles: realFiles.length,
  totalBytes: realFiles.reduce((sum, file) => sum + file.size, 0),
  byFolder,
  databaseUrlCounts: tables,
  ftpConfigured: Boolean(
    process.env.HOSTINGER_FTP_HOST &&
      process.env.HOSTINGER_FTP_USER &&
      process.env.HOSTINGER_FTP_PASSWORD
  ),
  files: realFiles,
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
const reportPath = path.join(REPORT_DIR, "inventory.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

const summary = { ...report, files: undefined };
console.log(JSON.stringify(summary, null, 2));
console.log(`Wrote ${reportPath}`);
