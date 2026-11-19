import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-images";
const REPORT = "scripts/migration-reports/deletion-manifest.json";

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
    files.push({
      path: objectPath,
      size: Number(item.metadata?.size || 0),
      mimetype: item.metadata?.mimetype || "",
    });
  }
}

function canonical(objectPath) {
  const decoded = decodeURIComponent(objectPath);
  return decoded.startsWith("products/draft/")
    ? `draft/${decoded.slice("products/draft/".length)}`
    : decoded;
}

function collectPaths(value, found) {
  if (typeof value === "string") {
    const pattern = /https?:\/\/[^"'\\\s]+\/(storage\/v1\/object\/public\/product-images|uploads)\/([^"'\\\s?]+)/g;
    for (const match of value.matchAll(pattern)) {
      found.push({
        objectPath: canonical(match[2]),
        via: match[1].startsWith("storage/") ? "supabase" : "hostinger",
      });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectPaths(item, found));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectPaths(item, found));
  }
}

async function referencesFrom(table, idColumn, columns) {
  const { data, error } = await supabase.from(table).select([idColumn, ...columns].join(","));
  if (error) return { error: error.message, refs: [] };
  const refs = [];
  for (const row of data || []) {
    for (const column of columns) {
      const paths = [];
      collectPaths(row[column], paths);
      for (const hit of paths) {
        refs.push({ table, id: row[idColumn], column, objectPath: hit.objectPath, via: hit.via });
      }
    }
  }
  return { refs };
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current]);
    }
  }
  await Promise.all(Array.from({ length: limit }, run));
  return results;
}

const files = [];
await walk("", files);
const manifest = JSON.parse(fs.readFileSync("scripts/migration-reports/manifest.json", "utf8")).files;

const scans = await Promise.all([
  referencesFrom("products", "id", ["images", "color_images", "color_swatches", "seo"]),
  referencesFrom("categories", "id", ["image", "image_url", "seo", "subcategory_seo"]),
  referencesFrom("banners", "id", ["image"]),
  referencesFrom("store_settings", "id", ["legal_pages", "offer", "seo"]),
  referencesFrom("orders", "id", ["items"]),
  referencesFrom("reviews", "id", ["comment"]),
  referencesFrom("store_pages", "slug", ["title", "intro", "body"]),
]);

const refsByPath = new Map();
const scanErrors = [];
for (const scan of scans) {
  if (scan.error) scanErrors.push(scan.error);
  for (const ref of scan.refs || []) {
    const list = refsByPath.get(ref.objectPath) || [];
    list.push({ table: ref.table, id: ref.id, column: ref.column, via: ref.via });
    refsByPath.set(ref.objectPath, list);
  }
}

const orderRefs = [];
for (const [objectPath, refs] of refsByPath) {
  if (refs.some((ref) => ref.table === "orders")) orderRefs.push({ objectPath, refs });
}

const checks = await mapPool(files, 8, async (file) => {
  const record = manifest[file.path];
  if (!record?.publicUrl || !record.verified || Number(record.uploadedBytes) !== Number(record.sourceBytes)) {
    return { path: file.path, accessible: false, status: 0 };
  }
  try {
    const response = await fetch(record.publicUrl, {
      method: "HEAD",
      redirect: "follow",
      headers: { "user-agent": "BudyBear-deletion-audit", "accept-encoding": "identity" },
    });
    return { path: file.path, accessible: response.ok, status: response.status };
  } catch {
    return { path: file.path, accessible: false, status: 0 };
  }
});
const live = new Map(checks.map((check) => [check.path, check]));

const proposed = [];
const preserved = [];

for (const file of files) {
  const record = manifest[file.path];
  const hostingerPath = canonical(file.path);
  const refs = refsByPath.get(hostingerPath) || [];
  const orderRefsForFile = refs.filter((ref) => ref.table === "orders");
  const supabaseRefs = refs.filter((ref) => ref.via === "supabase");
  const catalogRefs = refs.filter((ref) => ref.table !== "orders" && ref.via === "hostinger");
  const check = live.get(file.path);
  const sizeMatches = Boolean(record) && Number(record.uploadedBytes) === Number(record.sourceBytes) && Number(record.sourceBytes) === file.size;
  const verifiedCopy = Boolean(record?.verified && record.publicUrl && sizeMatches && check?.accessible);
  const reasons = [];
  if (!record) reasons.push("No migration record.");
  else {
    if (!record.verified) reasons.push("Migration record is not verified.");
    if (!sizeMatches) reasons.push("Stored size does not match the Hostinger copy.");
    if (!check?.accessible) reasons.push(`Hostinger URL is not accessible (${check?.status || "no response"}).`);
  }
  if (supabaseRefs.some((ref) => ref.table === "orders" && String(ref.id) === "BB-1039")) reasons.push("Historical image for order BB-1039.");
  else if (orderRefsForFile.length) reasons.push("Referenced by an order snapshot.");
  if (supabaseRefs.some((ref) => ref.table !== "orders")) reasons.push("A database record still stores the Supabase URL.");
  if (catalogRefs.length) reasons.push("Referenced by an active catalog record through its Hostinger URL.");

  const entry = {
    bucket: BUCKET,
    supabasePath: file.path,
    bytes: file.size,
    hostingerUrl: record?.publicUrl || "",
    databaseReferences: refs,
    migrationVerified: Boolean(record?.verified && sizeMatches),
    hostingerAccessible: Boolean(check?.accessible),
    safeToDelete: scanErrors.length === 0 && verifiedCopy && reasons.length === 0,
    reason: reasons.length ? reasons.join(" ") : "Verified Hostinger copy and no database record references this image.",
  };
  if (entry.safeToDelete) proposed.push(entry);
  else preserved.push(entry);
}

const manifestOut = {
  generatedAt: new Date().toISOString(),
  bucket: BUCKET,
  deletionPerformed: false,
  storageFiles: files.length,
  proposedDeletions: proposed.length,
  preserved: preserved.length,
  scanErrors,
  orderReferences: orderRefs,
  proposed,
  preserved,
};

fs.writeFileSync(REPORT, JSON.stringify(manifestOut, null, 2));

const preservedSummary = preserved.map((entry) => ({
  supabasePath: entry.supabasePath,
  reason: entry.reason,
  references: entry.databaseReferences,
}));

console.log(JSON.stringify({
  bucket: BUCKET,
  storageFiles: files.length,
  proposedDeletions: proposed.length,
  preserved: preserved.length,
  preservedSummary,
  scanErrors,
  orderReferences: orderRefs.map((item) => ({
    objectPath: item.objectPath,
    orders: item.refs.filter((ref) => ref.table === "orders").map((ref) => ref.id),
  })),
  report: REPORT,
}, null, 2));
