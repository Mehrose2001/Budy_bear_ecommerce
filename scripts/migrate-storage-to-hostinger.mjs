import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-images";
const REPORT_DIR = path.join("scripts", "migration-reports");
const MANIFEST_PATH = path.join(REPORT_DIR, "manifest.json");
const BACKUP_PATH = path.join(REPORT_DIR, "image-url-backup.json");
const REPORT_PATH = path.join(REPORT_DIR, "migration-report.json");

const URL_TABLES = [
  {
    table: "products",
    id: "id",
    columns: ["images", "color_images", "color_swatches", "seo"],
  },
  {
    table: "categories",
    id: "id",
    columns: ["image", "image_url", "seo", "subcategory_seo"],
  },
  {
    table: "banners",
    id: "id",
    columns: ["image"],
  },
  {
    table: "store_settings",
    id: "id",
    columns: ["legal_pages", "offer", "seo"],
  },
];

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

function arg(name) {
  return process.argv.includes(name);
}

function mediaBase() {
  return String(
    process.env.HOSTINGER_PUBLIC_BASE_URL || "https://budybear.com/uploads"
  ).replace(/\/$/, "");
}

function remoteRoot() {
  return String(process.env.HOSTINGER_REMOTE_DIR || "/public_html/uploads").replace(/\/$/, "");
}

function supabaseUrl() {
  return (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
}

function client() {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role is not configured.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function ftpConfigured() {
  return Boolean(
    process.env.HOSTINGER_FTP_HOST &&
      process.env.HOSTINGER_FTP_USER &&
      process.env.HOSTINGER_FTP_PASSWORD
  );
}

function isFolder(item) {
  return item.id == null && item.metadata == null;
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
    if (isFolder(item)) {
      await walk(supabase, objectPath, files);
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

function hostingerRelative(objectPath) {
  const prefix = "products/draft/";
  if (objectPath.startsWith(prefix)) return `draft/${objectPath.slice(prefix.length)}`;
  return objectPath;
}

function publicObjectUrl(objectPath) {
  return `${supabaseUrl()}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

function hostingerUrl(objectPath) {
  return `${mediaBase()}/${hostingerRelative(objectPath)}`;
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

async function connectFtp() {
  const { Client } = await import("basic-ftp");
  const ftp = new Client(120000);
  await ftp.access({
    host: process.env.HOSTINGER_FTP_HOST,
    user: process.env.HOSTINGER_FTP_USER,
    password: process.env.HOSTINGER_FTP_PASSWORD,
    port: Number(process.env.HOSTINGER_FTP_PORT || 21),
    secure: false,
  });
  return ftp;
}

async function verifyHttp(url) {
  const headers = {
    "user-agent": "BudyBear-media-migration",
    "accept-encoding": "identity",
  };
  let response = await fetch(url, { method: "HEAD", redirect: "follow", headers });
  if (!response.ok) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    response = await fetch(url, { method: "HEAD", redirect: "follow", headers });
  }
  const type = response.headers.get("content-type") || "";
  const lengthHeader = response.headers.get("content-length");
  const httpBytes = lengthHeader == null ? null : Number(lengthHeader);
  const readableType = /^(image|video|font|application\/octet-stream|text\/plain)/i.test(type);
  return {
    httpStatus: response.status,
    httpBytes,
    contentType: type,
    accessible: response.ok && (readableType || (httpBytes != null && httpBytes > 0)),
  };
}

async function remoteSize(ftp, remoteFile, filename) {
  try {
    return await ftp.size(remoteFile);
  } catch {
    return ftp.size(filename);
  }
}

async function copyFiles(supabase, files) {
  const manifest = readJson(MANIFEST_PATH, { files: {} });
  const destinations = new Map();
  const duplicates = [];
  for (const file of files) {
    const relative = hostingerRelative(file.path);
    if (destinations.has(relative)) {
      duplicates.push({ path: file.path, conflictsWith: destinations.get(relative) });
    } else {
      destinations.set(relative, file.path);
    }
  }
  if (duplicates.length) {
    const error = new Error("Duplicate Hostinger destinations. No files were overwritten.");
    error.duplicates = duplicates;
    throw error;
  }

  const ftp = await connectFtp();
  const results = [];
  try {
    for (const file of files) {
      const relative = hostingerRelative(file.path);
      const previous = manifest.files[file.path];
      const remoteDir = `${remoteRoot()}/${path.posix.dirname(relative)}`.replace(/\/\.$/, "");
      const remoteFile = `${remoteRoot()}/${relative}`;
      let record = {
        sourcePath: file.path,
        sourceBytes: file.size,
        mimetype: file.mimetype,
        hostingerPath: remoteFile,
        publicUrl: hostingerUrl(file.path),
        supabaseUrl: publicObjectUrl(file.path),
        verified: false,
      };

      try {
        const filename = path.posix.basename(relative);
        let existingSize = null;
        try {
          existingSize = await remoteSize(ftp, remoteFile, filename);
        } catch {
          existingSize = null;
        }
        if (existingSize === file.size) {
          const http = await verifyHttp(record.publicUrl);
          record = { ...record, ...http, uploadedBytes: existingSize, skipped: true };
          record.verified = http.accessible;
          if (!record.verified) record.error = `Public check failed (${http.httpStatus}).`;
          results.push(record);
          manifest.files[file.path] = record;
          writeJson(MANIFEST_PATH, manifest);
          console.log(`${record.verified ? "verified" : "failed"} ${relative}`);
          continue;
        }

        const downloaded = await supabase.storage.from(BUCKET).download(file.path);
        if (downloaded.error || !downloaded.data) {
          throw new Error(downloaded.error?.message || "Download failed.");
        }
        const bytes = Buffer.from(await downloaded.data.arrayBuffer());
        if (file.size && bytes.length !== file.size) {
          throw new Error(`Downloaded ${bytes.length} bytes, storage lists ${file.size}.`);
        }
        await ftp.ensureDir(remoteDir);
        await ftp.uploadFrom(Readable.from(bytes), filename);
        const uploadedBytes = await remoteSize(ftp, remoteFile, filename);
        if (uploadedBytes !== bytes.length) {
          throw new Error(`Hostinger size ${uploadedBytes} does not match ${bytes.length}.`);
        }
        const http = await verifyHttp(record.publicUrl);
        record = { ...record, ...http, uploadedBytes, sourceBytes: bytes.length };
        record.verified = http.accessible;
        if (!record.verified) record.error = `Public check failed (${http.httpStatus}).`;
      } catch (error) {
        record.error = error.message || String(error);
        record.verified = false;
      }

      results.push(record);
      manifest.files[file.path] = record;
      writeJson(MANIFEST_PATH, manifest);
      console.log(`${record.verified ? "migrated" : "failed"} ${relative}${record.error ? ` — ${record.error}` : ""}`);
    }
  } finally {
    ftp.close();
  }
  return results;
}

const STORAGE_URL = /https?:\/\/[^"'\\\s]+\/storage\/v1\/object\/public\/product-images\/[^"'\\\s?]+/g;

function collectUrls(value, found) {
  if (typeof value === "string") {
    const matches = value.match(STORAGE_URL);
    if (matches) found.push(...matches);
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

function replaceUrls(value, pairs) {
  if (typeof value === "string") {
    let next = value;
    for (const [from, to] of pairs) {
      if (next.includes(from)) next = next.split(from).join(to);
    }
    return next;
  }
  if (Array.isArray(value)) return value.map((item) => replaceUrls(item, pairs));
  if (value && typeof value === "object") {
    const next = {};
    for (const [key, item] of Object.entries(value)) next[key] = replaceUrls(item, pairs);
    return next;
  }
  return value;
}

function changed(before, after) {
  return JSON.stringify(before) !== JSON.stringify(after);
}

async function census(supabase, files) {
  const filePaths = new Set(files.map((file) => file.path));
  const counts = [];
  const referenced = new Set();
  for (const spec of URL_TABLES) {
    const { data, error } = await supabase.from(spec.table).select([spec.id, ...spec.columns].join(","));
    if (error) {
      counts.push({ table: spec.table, error: error.message });
      continue;
    }
    let urls = 0;
    for (const row of data || []) {
      const found = [];
      for (const column of spec.columns) collectUrls(row[column], found);
      urls += found.length;
      for (const url of found) {
        const marker = `/storage/v1/object/public/${BUCKET}/`;
        const index = url.indexOf(marker);
        if (index >= 0) {
          referenced.add(decodeURIComponent(url.slice(index + marker.length).split(/[?#]/)[0]));
        }
      }
    }
    counts.push({ table: spec.table, rows: (data || []).length, supabaseUrlFields: urls });
  }

  const orders = await supabase.from("orders").select("id, items");
  let orderUrls = 0;
  if (!orders.error) {
    for (const row of orders.data || []) {
      const found = [];
      collectUrls(row.items, found);
      orderUrls += found.length;
    }
  }

  const missingFromStorage = [...referenced].filter((objectPath) => !filePaths.has(objectPath));
  const unreferenced = files.filter((file) => !referenced.has(file.path)).map((file) => file.path);
  const byFolder = {};
  for (const file of files) {
    const folder = hostingerRelative(file.path).split("/")[0];
    const entry = byFolder[folder] || { files: 0, bytes: 0 };
    entry.files += 1;
    entry.bytes += file.size;
    byFolder[folder] = entry;
  }

  return {
    mediaFiles: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.size, 0),
    byFolder,
    database: counts,
    orderItemUrlsLeftUntouched: orders.error ? orders.error.message : orderUrls,
    referencedPaths: referenced.size,
    missingFromStorage,
    unreferencedFiles: unreferenced.length,
  };
}

async function updateUrls(supabase, results) {
  const pairs = results
    .filter((item) => item.verified && item.supabaseUrl && item.publicUrl)
    .map((item) => [item.supabaseUrl, item.publicUrl])
    .sort((a, b) => b[0].length - a[0].length);
  if (!pairs.length) throw new Error("No verified Hostinger URLs are available. Database was not changed.");

  const backup = { createdAt: new Date().toISOString(), tables: {} };
  for (const spec of URL_TABLES) {
    const { data, error } = await supabase.from(spec.table).select([spec.id, ...spec.columns].join(","));
    if (error) throw new Error(`${spec.table}: ${error.message}`);
    backup.tables[spec.table] = data || [];
  }
  writeJson(BACKUP_PATH, backup);

  const updated = [];
  for (const spec of URL_TABLES) {
    for (const row of backup.tables[spec.table]) {
      const patch = {};
      for (const column of spec.columns) {
        const after = replaceUrls(row[column], pairs);
        if (changed(row[column], after)) patch[column] = after;
      }
      if (!Object.keys(patch).length) continue;
      const { error } = await supabase.from(spec.table).update(patch).eq(spec.id, row[spec.id]);
      if (error) {
        throw new Error(
          `${spec.table} ${row[spec.id]} was not updated (${error.message}). Earlier rows in this run may already be updated. Backup: ${BACKUP_PATH}`
        );
      }
      updated.push({ table: spec.table, id: row[spec.id], columns: Object.keys(patch) });
    }
  }
  return { pairs: pairs.length, updated };
}

const supabase = client();
const files = [];
await walk(supabase, "", files);
const summary = await census(supabase, files);

if (arg("--census")) {
  console.log(JSON.stringify({ ...summary, ftpConfigured: ftpConfigured(), remoteRoot: remoteRoot(), publicBase: mediaBase() }, null, 2));
  process.exit(0);
}

if (!ftpConfigured()) {
  console.error(
    "Hostinger FTP is not configured. Set HOSTINGER_FTP_HOST, HOSTINGER_FTP_USER, and HOSTINGER_FTP_PASSWORD in .env.local. No files were copied and no database rows were changed."
  );
  console.log(JSON.stringify(summary, null, 2));
  process.exit(2);
}

const results = await copyFiles(supabase, files);
const failed = results.filter((item) => !item.verified);
let database = { updated: [], skipped: true };
if (arg("--update-urls")) {
  if (!arg("--confirm-url-update")) {
    throw new Error("Refusing to update URLs without --confirm-url-update.");
  }
  if (failed.length) {
    throw new Error(
      `${failed.length} files are not verified. Database URLs were not changed. See ${MANIFEST_PATH}.`
    );
  }
  database = await updateUrls(supabase, results);
}

const report = {
  generatedAt: new Date().toISOString(),
  remoteRoot: remoteRoot(),
  publicBase: mediaBase(),
  totalFilesFound: files.length,
  migrated: results.filter((item) => item.verified).length,
  failed: failed.map((item) => ({ path: item.sourcePath, error: item.error })),
  duplicates: [],
  database,
  supabaseFilesDeleted: false,
  census: summary,
};
writeJson(REPORT_PATH, report);
console.log(JSON.stringify({ ...report, census: undefined }, null, 2));
if (failed.length) process.exit(1);
