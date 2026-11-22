import { createHash } from "crypto";
import { mkdir, stat, writeFile, readFile, access, constants } from "fs/promises";
import path from "path";

function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

export function publicMediaBaseUrl() {
  return clean(
    process.env.HOSTINGER_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_MEDIA_URL ||
      "https://budybear.com/uploads"
  ).replace(/\/$/, "");
}

export function mediaRootPath() {
  const configured = clean(process.env.MEDIA_ROOT);
  if (configured) return path.resolve(configured);
  if (process.env.NODE_ENV === "production") {
    return "";
  }
  return path.resolve(process.cwd(), "storage", "uploads");
}

export function isMediaRootConfigured() {
  return Boolean(mediaRootPath());
}

export async function assertMediaRootWritable() {
  const root = mediaRootPath();
  if (!root) {
    throw new Error(
      "MEDIA_ROOT is not set. Use a directory outside public_html and hbuilds, for example /home/USER/domains/budybear.com/storage/uploads."
    );
  }
  await mkdir(root, { recursive: true });
  await access(root, constants.W_OK);
  return root;
}

export function safeMediaRelative(relativePath) {
  const normalized = String(relativePath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
  if (!normalized || normalized.includes("..")) return "";
  if (!/^[a-zA-Z0-9._/-]+$/.test(normalized)) return "";
  return normalized;
}

export function absoluteMediaPath(relativePath) {
  const relative = safeMediaRelative(relativePath);
  if (!relative) return "";
  const root = mediaRootPath();
  if (!root) return "";
  const absolute = path.resolve(root, relative);
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (absolute !== root && !absolute.startsWith(rootWithSep)) return "";
  return absolute;
}

export function publicMediaUrl(relativePath) {
  const relative = safeMediaRelative(relativePath);
  if (!relative) return "";
  return `${publicMediaBaseUrl()}/${relative}`;
}

export async function writeMediaFile(relativePath, bytes) {
  const absolute = absoluteMediaPath(relativePath);
  if (!absolute) throw new Error("Invalid media path.");
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
  return {
    relativePath: safeMediaRelative(relativePath),
    absolutePath: absolute,
    publicUrl: publicMediaUrl(relativePath),
    bytes: bytes.length,
    checksum: sha256(bytes),
  };
}

export async function mediaFileStat(relativePath) {
  const absolute = absoluteMediaPath(relativePath);
  if (!absolute) return null;
  try {
    const info = await stat(absolute);
    if (!info.isFile()) return null;
    return { absolutePath: absolute, size: info.size, mtime: info.mtime };
  } catch {
    return null;
  }
}

export async function readMediaFile(relativePath) {
  const absolute = absoluteMediaPath(relativePath);
  if (!absolute) return null;
  try {
    return await readFile(absolute);
  } catch {
    return null;
  }
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function persistenceProbePath() {
  return absoluteMediaPath(".budybear-persistence-probe.json");
}

export const MEDIA_FOLDERS = ["products", "banners", "categories", "offer", "draft"];
