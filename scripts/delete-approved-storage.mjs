import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-images";
const MANIFEST = "scripts/migration-reports/deletion-manifest.json";
const REPORT = "scripts/migration-reports/deletion-result.json";
const PRESERVE = new Set([
  "products/draft/1794177783622-d2f2e0b8-da2a-4a80-adc7-539aa3c03f1a.webp",
  "products/draft/1795114162047-419b3972-f393-462e-ba71-55b4f9970add.webp",
]);

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv(".env.local");
loadEnv("backend/.env");

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function canonical(objectPath) {
  const decoded = decodeURIComponent(objectPath);
  return decoded.startsWith("products/draft/")
    ? `draft/${decoded.slice("products/draft/".length)}`
    : decoded;
}

function collectPaths(value, found) {
  if (typeof value === "string") {
    const pattern = /https?:\/\/[^"'\\\s]+\/(?:storage\/v1\/object\/public\/product-images|uploads)\/([^"'\\\s?]+)/g;
    for (const match of value.matchAll(pattern)) found.push(canonical(match[1]));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectPaths(item, found));
    return;
  }
  if (value && typeof value === "object") Object.values(value).forEach((item) => collectPaths(item, found));
}

async function referencedPaths() {
  const tables = [
    ["products", "id", ["images", "color_images", "color_swatches", "seo"]],
    ["categories", "id", ["image", "image_url", "seo", "subcategory_seo"]],
    ["banners", "id", ["image"]],
    ["store_settings", "id", ["legal_pages", "offer", "seo"]],
    ["orders", "id", ["items"]],
    ["reviews", "id", ["comment"]],
    ["store_pages", "slug", ["title", "intro", "body"]],
  ];
  const found = new Set();
  for (const [table, idColumn, columns] of tables) {
    const { data, error } = await supabase.from(table).select([idColumn, ...columns].join(","));
    if (error) throw new Error(`Reference scan failed for ${table}: ${error.message}`);
    for (const row of data || []) {
      const paths = [];
      for (const column of columns) collectPaths(row[column], paths);
      paths.forEach((path) => found.add(path));
    }
  }
  return found;
}

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
  for (const item of await listFolder(prefix)) {
    const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (isFolder(item)) {
      await walk(objectPath, files);
      continue;
    }
    if (item.name === ".emptyFolderPlaceholder") continue;
    files.push(objectPath);
  }
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  }
  await Promise.all(Array.from({ length: limit }, run));
  return results;
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const proposed = manifest.proposed || [];
if (manifest.bucket !== BUCKET) throw new Error("Manifest bucket is not product-images.");
if (manifest.deletionPerformed) throw new Error("Manifest already records a deletion.");
if (proposed.length !== 126) throw new Error(`Expected 126 approved objects, found ${proposed.length}.`);

const paths = proposed.map((entry) => entry.supabasePath);
if (new Set(paths).size !== paths.length) throw new Error("Duplicate paths in the approved manifest.");
for (const path of PRESERVE) {
  if (paths.includes(path)) throw new Error(`Approved list includes a protected file: ${path}`);
  if (!manifest.preserved.some((entry) => entry.supabasePath === path)) {
    throw new Error(`Protected file is missing from the preserved list: ${path}`);
  }
}
for (const entry of proposed) {
  if (entry.bucket !== BUCKET) throw new Error(`Unexpected bucket for ${entry.supabasePath}`);
  if (!entry.safeToDelete || !entry.migrationVerified || !entry.hostingerAccessible) {
    throw new Error(`Entry is not eligible: ${entry.supabasePath}`);
  }
  if (!entry.hostingerUrl.startsWith("https://budybear.com/uploads/")) {
    throw new Error(`Unexpected Hostinger URL for ${entry.supabasePath}`);
  }
  if (entry.databaseReferences?.length) throw new Error(`Entry has database references: ${entry.supabasePath}`);
}

const references = await referencedPaths();
const skipped = [];
const eligible = [];
for (const entry of proposed) {
  if (references.has(canonical(entry.supabasePath))) {
    skipped.push({ supabasePath: entry.supabasePath, hostingerUrl: entry.hostingerUrl, reason: "Database reference appeared after approval." });
    continue;
  }
  eligible.push(entry);
}

const checks = await mapPool(eligible, 8, async (entry) => {
  try {
    const response = await fetch(entry.hostingerUrl, {
      method: "HEAD",
      redirect: "follow",
      headers: { "user-agent": "BudyBear-approved-deletion", "accept-encoding": "identity" },
    });
    const type = response.headers.get("content-type") || "";
    return { entry, ok: response.ok && type.startsWith("image/"), status: response.status };
  } catch (error) {
    return { entry, ok: false, status: 0, error: error.message };
  }
});

const ready = [];
for (const check of checks) {
  if (check.ok) ready.push(check.entry);
  else skipped.push({
    supabasePath: check.entry.supabasePath,
    hostingerUrl: check.entry.hostingerUrl,
    reason: `Hostinger check failed before deletion (${check.status || check.error || "no response"}).`,
  });
}

const removalErrors = [];
for (let offset = 0; offset < ready.length; offset += 50) {
  const batch = ready.slice(offset, offset + 50).map((entry) => entry.supabasePath);
  const { error } = await supabase.storage.from(BUCKET).remove(batch);
  if (error) removalErrors.push({ paths: batch, message: error.message });
}

const remaining = [];
await walk("", remaining);
const remainingSet = new Set(remaining);
const attempted = ready.map((entry) => entry.supabasePath);
const stillPresent = attempted.filter((objectPath) => remainingSet.has(objectPath));
const deleted = attempted.filter((objectPath) => !remainingSet.has(objectPath));
const protectedMissing = [...PRESERVE].filter((objectPath) => !remainingSet.has(objectPath));
const errors = [...removalErrors];
if (stillPresent.length) errors.push({ paths: stillPresent, message: "Object remained in the bucket after removal." });

const hostingerAfter = await mapPool(proposed, 8, async (entry) => {
  try {
    const response = await fetch(entry.hostingerUrl, {
      method: "HEAD",
      redirect: "follow",
      headers: { "user-agent": "BudyBear-deletion-verify", "accept-encoding": "identity" },
    });
    return { supabasePath: entry.supabasePath, hostingerUrl: entry.hostingerUrl, status: response.status, accessible: response.ok };
  } catch (error) {
    return { supabasePath: entry.supabasePath, hostingerUrl: entry.hostingerUrl, status: 0, accessible: false, error: error.message };
  }
});
const hostingerFailed = hostingerAfter.filter((item) => !item.accessible);

const orderImage = "https://bdmihntpuyiuhtrkllil.supabase.co/storage/v1/object/public/product-images/products/draft/1794177783622-d2f2e0b8-da2a-4a80-adc7-539aa3c03f1a.webp";
const orderResponse = await fetch(orderImage, { method: "HEAD", redirect: "follow" });

const result = {
  generatedAt: new Date().toISOString(),
  bucket: BUCKET,
  bucketDeleted: false,
  approved: proposed.length,
  deleted: deleted.length,
  skipped: skipped.length,
  errors: errors.length,
  remainingObjects: remaining.length,
  approvedObjectsStillPresent: stillPresent,
  protectedMissing,
  hostingerAccessible: hostingerAfter.filter((item) => item.accessible).length,
  hostingerFailed,
  orderImageStatus: orderResponse.status,
  deletedPaths: deleted,
  skipped,
  errorDetails: errors,
};

fs.writeFileSync(REPORT, JSON.stringify(result, null, 2));
if (stillPresent.length || protectedMissing.length || hostingerFailed.length) {
  console.log(JSON.stringify({ ...result, deletedPaths: undefined }, null, 2));
  process.exitCode = 1;
} else if (skipped.length === 0 && deleted.length === proposed.length) {
  manifest.deletionPerformed = true;
  manifest.deletionResult = REPORT;
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({
    deleted: result.deleted,
    skipped: result.skipped,
    errors: result.errors,
    remainingObjects: result.remainingObjects,
    hostingerAccessible: result.hostingerAccessible,
    orderImageStatus: result.orderImageStatus,
    protectedMissing: result.protectedMissing,
    report: REPORT,
  }, null, 2));
} else {
  console.log(JSON.stringify({
    deleted: result.deleted,
    skipped: result.skipped,
    errors: result.errors,
    remainingObjects: result.remainingObjects,
    hostingerAccessible: result.hostingerAccessible,
    orderImageStatus: result.orderImageStatus,
    protectedMissing: result.protectedMissing,
    report: REPORT,
  }, null, 2));
}
