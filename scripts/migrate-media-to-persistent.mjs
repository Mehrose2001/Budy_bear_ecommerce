import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { arg, loadEnvFiles, reportDir, writeJson } from "./lib/migration-env.mjs";

loadEnvFiles();

const dryRun = !arg("--execute");
const updateMysqlUrls = arg("--update-urls") && arg("--confirm-url-update");
const BUCKET = "product-images";

function mediaRoot() {
  const configured = String(process.env.MEDIA_ROOT || "").trim();
  if (configured) return path.resolve(configured);
  return path.resolve("storage", "uploads");
}

function publicBase() {
  return String(process.env.HOSTINGER_PUBLIC_BASE_URL || "https://budybear.com/uploads").replace(/\/$/, "");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function hostingerRelative(objectPath) {
  if (objectPath.startsWith("products/draft/")) return `draft/${objectPath.slice("products/draft/".length)}`;
  return objectPath.replace(/^\/+/, "");
}

function collectUrls(value, found) {
  if (typeof value === "string") {
    const matches = value.match(/https?:\/\/[^"'\\\s]+/g) || [];
    for (const url of matches) {
      if (/product-images|\/uploads\//.test(url)) found.add(url.replace(/\\/g, ""));
    }
    if (value.startsWith("/uploads/") || value.startsWith("/media/")) found.add(value);
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

function rewriteValue(value, pairs) {
  if (typeof value === "string") {
    let next = value;
    for (const [from, to] of pairs) next = next.split(from).join(to);
    return next;
  }
  if (Array.isArray(value)) return value.map((item) => rewriteValue(item, pairs));
  if (value && typeof value === "object") {
    const next = {};
    for (const [key, item] of Object.entries(value)) next[key] = rewriteValue(item, pairs);
    return next;
  }
  return value;
}

async function listFolder(supabase, prefix) {
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

async function walk(supabase, prefix, files) {
  for (const item of await listFolder(supabase, prefix)) {
    const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id == null && item.metadata == null) {
      await walk(supabase, objectPath, files);
      continue;
    }
    if (item.name === ".emptyFolderPlaceholder") continue;
    files.push({
      source: "supabase",
      path: objectPath,
      size: Number(item.metadata?.size || 0),
    });
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || (!serviceKey && !anonKey)) {
  console.error("A Supabase key is required to read storage URLs. No files were copied.");
  process.exit(1);
}

function makeClient(key) {
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let supabase = makeClient(serviceKey || anonKey);
{
  const probe = await supabase.from("products").select("id").limit(1);
  if (probe.error && /invalid api key/i.test(probe.error.message || "") && anonKey && anonKey !== serviceKey) {
    supabase = makeClient(anonKey);
  }
}

const files = [];
let storageListError = null;
try {
  await walk(supabase, "", files);
} catch (error) {
  storageListError = error.message;
}

const urlTables = [
  { table: "products", id: "id", columns: ["images", "color_images", "color_swatches", "seo"] },
  { table: "categories", id: "id", columns: ["image", "image_url", "seo", "subcategory_seo", "banner", "subcategory_banners"] },
  { table: "banners", id: "id", columns: ["image", "mobile_image"] },
  { table: "store_settings", id: "id", columns: ["legal_pages", "offer", "seo", "seasonal_banner"] },
];

const referenced = new Set();
const dbCounts = [];
for (const spec of urlTables) {
  const { data, error } = await supabase.from(spec.table).select([spec.id, ...spec.columns].join(","));
  if (error) {
    dbCounts.push({ table: spec.table, error: error.message });
    continue;
  }
  let urls = 0;
  for (const row of data || []) {
    const found = new Set();
    for (const column of spec.columns) collectUrls(row[column], found);
    urls += found.size;
    found.forEach((url) => referenced.add(url));
  }
  dbCounts.push({ table: spec.table, rows: (data || []).length, urls });
}

const httpCandidates = [];
for (const url of referenced) {
  if (/budybear\.com\/uploads\//i.test(url)) {
    const relative = url.split("/uploads/")[1];
    if (relative) httpCandidates.push({ source: "public_html_http", path: relative, url });
    continue;
  }
  const marker = "/storage/v1/object/public/product-images/";
  const idx = url.indexOf(marker);
  if (idx >= 0) {
    const objectPath = decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
    if (objectPath) {
      httpCandidates.push({
        source: "supabase_public_http",
        path: hostingerRelative(objectPath),
        url,
      });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  dryRun,
  mediaRoot: mediaRoot(),
  publicBase: publicBase(),
  supabaseFiles: files.length,
  storageListError,
  httpHostingerCandidates: httpCandidates.length,
  database: dbCounts,
  copied: 0,
  skippedExisting: 0,
  failed: [],
  verified: 0,
  mysqlUrlsUpdated: 0,
  supabaseUnchanged: true,
};

if (dryRun) {
  report.note =
    "Dry-run only. Re-run with --execute to copy into MEDIA_ROOT. Add --update-urls --confirm-url-update to rewrite MySQL URLs after files verify. Supabase is never written.";
  writeJson(`${reportDir()}/media-migration-report.json`, report);
  console.log(JSON.stringify({ ...report, sample: files.slice(0, 20) }, null, 2));
  process.exit(0);
}

fs.mkdirSync(mediaRoot(), { recursive: true });

async function saveBytes(relativePath, bytes, expectedSize) {
  const dest = path.join(mediaRoot(), relativePath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size === bytes.length) {
    report.skippedExisting += 1;
    return { ok: true, skipped: true, checksum: sha256(bytes) };
  }
  if (fs.existsSync(dest) && fs.statSync(dest).size !== bytes.length) {
    const unique = dest.replace(/(\.[^.]+)?$/, `-${Date.now()}$1`);
    fs.writeFileSync(unique, bytes);
    report.failed.push({
      path: relativePath,
      error: `Existing file size differed. Wrote ${path.basename(unique)} instead of overwriting.`,
    });
    return { ok: false };
  }
  fs.writeFileSync(dest, bytes);
  if (expectedSize && bytes.length !== expectedSize) {
    report.failed.push({ path: relativePath, error: `Size ${bytes.length} != ${expectedSize}` });
    return { ok: false };
  }
  report.copied += 1;
  report.verified += 1;
  return { ok: true, checksum: sha256(bytes) };
}

for (const file of files) {
  const relative = hostingerRelative(file.path);
  try {
    const downloaded = await supabase.storage.from(BUCKET).download(file.path);
    if (downloaded.error || !downloaded.data) throw new Error(downloaded.error?.message || "Download failed");
    const bytes = Buffer.from(await downloaded.data.arrayBuffer());
    await saveBytes(relative, bytes, file.size);
  } catch (error) {
    report.failed.push({ path: file.path, error: error.message });
  }
}

for (const file of httpCandidates) {
  try {
    const response = await fetch(file.url, { redirect: "follow" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    await saveBytes(file.path, bytes, bytes.length);
  } catch (error) {
    report.failed.push({ path: file.url, error: error.message });
  }
}

if (updateMysqlUrls) {
  const mysql = await import("mysql2/promise");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    const pairs = files
      .map((file) => [
        `${String(supabaseUrl).replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${file.path}`,
        `${publicBase()}/${hostingerRelative(file.path)}`,
      ])
      .sort((a, b) => b[0].length - a[0].length);
    for (const spec of urlTables) {
      const [rows] = await connection.execute(`SELECT ${[spec.id, ...spec.columns].join(", ")} FROM ${spec.table}`);
      for (const row of rows) {
        const patch = {};
        for (const column of spec.columns) {
          const after = rewriteValue(row[column], pairs);
          if (JSON.stringify(after) !== JSON.stringify(row[column])) patch[column] = after;
        }
        if (!Object.keys(patch).length) continue;
        const assignments = Object.keys(patch)
          .map((column) => `${column} = ?`)
          .join(", ");
        const values = Object.values(patch).map((value) =>
          value == null || typeof value === "string" ? value : JSON.stringify(value)
        );
        values.push(row[spec.id]);
        await connection.execute(`UPDATE ${spec.table} SET ${assignments} WHERE ${spec.id} = ?`, values);
        report.mysqlUrlsUpdated += 1;
      }
    }
  } finally {
    await connection.end();
  }
}

writeJson(`${reportDir()}/media-migration-report.json`, report);
console.log(JSON.stringify(report, null, 2));
if (report.failed.length) process.exit(1);
