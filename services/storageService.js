import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { AppError } from "@/lib/errors";

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

function isFtpConfigured() {
  return Boolean(
    process.env.HOSTINGER_FTP_HOST &&
      process.env.HOSTINGER_FTP_USER &&
      process.env.HOSTINGER_FTP_PASSWORD
  );
}

function shouldWriteLocalMedia() {
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") return false;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (site && !/localhost|127\.0\.0\.1/i.test(site)) return false;
  return true;
}

export function getProductImageUrl(objectPath) {
  if (!objectPath) return "";
  if (/^https?:\/\//i.test(objectPath) || objectPath.startsWith("/")) return objectPath;
  const hostinger = mediaBaseUrl();
  if (hostinger) return `${hostinger}/${objectPath.replace(/^\/+/, "")}`;
  return objectPath;
}

async function uploadToHostingerFtp(bytes, folder, filename) {
  const { Client } = await import("basic-ftp");
  const client = new Client(25000);
  const remoteDir = `${remoteRoot()}/${folder}`;
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
  const base = mediaBaseUrl();
  if (!base) {
    throw new AppError("Set HOSTINGER_PUBLIC_BASE_URL so uploaded images can be loaded.", 500);
  }
  return `${base}/${folder}/${filename}`;
}

async function uploadToLocalMedia(bytes, folder, filename) {
  const dir = path.join(process.cwd(), "public", "media", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/media/${folder}/${filename}`;
}

export async function uploadProductImage(productId, file, _accessToken, folder = "products") {
  assertFile(file);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_BYTES) {
    throw new AppError("Image must be under 6MB.", 400);
  }

  const filename = `${Date.now()}-${crypto.randomUUID()}${extensionOf(file)}`;
  const destination = destinationFolder(folder, productId);

  if (isFtpConfigured()) {
    const url = await uploadToHostingerFtp(bytes, destination, filename);
    return { path: url, url };
  }

  if (shouldWriteLocalMedia()) {
    const url = await uploadToLocalMedia(bytes, destination, filename);
    return { path: url, url };
  }

  throw new AppError(
    "Set HOSTINGER_FTP_HOST, HOSTINGER_FTP_USER, and HOSTINGER_FTP_PASSWORD. New images are stored on Hostinger.",
    503
  );
}

export async function deleteProductImage() {
  return false;
}
