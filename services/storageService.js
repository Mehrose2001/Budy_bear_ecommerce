import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { AppError } from "@/lib/errors";
import {
  isMediaRootConfigured,
  publicMediaUrl,
  writeMediaFile,
} from "@/lib/mediaRoot";
import { normalizeMediaUrl } from "@/lib/mediaUrl";

export const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

function assertFile(file) {
  if (!file) throw new AppError("Choose an image to upload.", 400);
  const type = file.type || "image/jpeg";
  if (!ALLOWED_TYPES.has(type) && !type.startsWith("image/")) {
    throw new AppError("Upload a JPG, PNG, WEBP, GIF, or SVG image.", 400);
  }
  if (typeof file.size === "number" && file.size > MAX_BYTES) {
    throw new AppError("Image must be under 6MB.", 400);
  }
}

function extensionOf(file) {
  const name = file.name || "upload.webp";
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/);
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/jpeg") return ".jpg";
  return match ? match[0] : ".jpg";
}

function mediaBaseUrl() {
  return String(
    process.env.HOSTINGER_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_MEDIA_URL ||
      "https://budybear.com/uploads"
  ).replace(/\/$/, "");
}

function remoteRoot() {
  return String(process.env.HOSTINGER_REMOTE_DIR || "/uploads").replace(/\/$/, "");
}

function destinationFolder(folder, productId) {
  const allowed = new Set(["products", "banners", "categories", "offer", "draft"]);
  const safe = allowed.has(folder) ? folder : "products";
  if (safe === "products" && !productId) return "draft";
  return safe;
}

function relativeUploadPath(folder, productId, filename) {
  const destination = destinationFolder(folder, productId);
  const hint = String(productId || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "");
  if (hint && destination !== "draft") return `${destination}/${hint}/${filename}`;
  return `${destination}/${filename}`;
}

function isFtpConfigured() {
  return Boolean(
    process.env.HOSTINGER_FTP_HOST &&
      process.env.HOSTINGER_FTP_USER &&
      process.env.HOSTINGER_FTP_PASSWORD
  );
}

function shouldWriteLocalMedia() {
  if (process.env.VERCEL === "1") return false;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (site && !/localhost|127\.0\.0\.1/i.test(site) && !isMediaRootConfigured()) return false;
  return true;
}

export function getProductImageUrl(objectPath) {
  return normalizeMediaUrl(objectPath) || objectPath || "";
}

async function uploadToHostingerFtp(bytes, relativePath) {
  const { Client } = await import("basic-ftp");
  const client = new Client(25000);
  const remoteFile = `${remoteRoot()}/${relativePath}`;
  const remoteDir = remoteFile.split("/").slice(0, -1).join("/") || remoteRoot();
  const filename = relativePath.split("/").pop();
  try {
    await client.access({
      host: process.env.HOSTINGER_FTP_HOST,
      user: process.env.HOSTINGER_FTP_USER,
      password: process.env.HOSTINGER_FTP_PASSWORD,
      port: Number(process.env.HOSTINGER_FTP_PORT || 21),
      secure: false,
    });
    await client.ensureDir(remoteDir);
    await client.uploadFrom(Readable.from(bytes), filename);
  } finally {
    client.close();
  }
  return `${mediaBaseUrl()}/${relativePath}`;
}

async function uploadToLocalMedia(bytes, relativePath) {
  const dir = path.join(process.cwd(), "public", "media", path.posix.dirname(relativePath));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", "media", relativePath), bytes);
  return `/media/${relativePath}`;
}

export async function uploadProductImage(productId, file, _accessToken, folder = "products") {
  assertFile(file);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_BYTES) {
    throw new AppError("Image must be under 6MB.", 400);
  }

  const filename = `${Date.now()}-${crypto.randomUUID()}${extensionOf(file)}`;
  const relativePath = relativeUploadPath(folder, productId, filename);

  if (isMediaRootConfigured()) {
    const stored = await writeMediaFile(relativePath, bytes);
    if (isFtpConfigured()) {
      try {
        await uploadToHostingerFtp(bytes, relativePath);
      } catch (error) {
        console.warn("FTP dual-write failed after MEDIA_ROOT save:", error.message);
      }
    }
    return { path: stored.publicUrl, url: stored.publicUrl };
  }

  if (isFtpConfigured()) {
    const url = await uploadToHostingerFtp(bytes, relativePath);
    return { path: url, url };
  }

  if (shouldWriteLocalMedia()) {
    const url = await uploadToLocalMedia(bytes, relativePath);
    return { path: url, url };
  }

  throw new AppError(
    "Set MEDIA_ROOT to a persistent Hostinger directory outside public_html, or configure HOSTINGER_FTP_*.",
    503
  );
}

export async function deleteProductImage() {
  return false;
}

export { publicMediaUrl };
