import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { AppError, throwIf } from "@/lib/errors";
import { createServiceClient, createUserClient } from "@/lib/supabase/server";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

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

function storageErrorMessage(error) {
  if (!error) return "Unable to upload image.";
  return error.message || error.error || error.statusCode || "Unable to upload image.";
}

function mediaBaseUrl() {
  return String(
    process.env.HOSTINGER_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_MEDIA_URL ||
      "https://budybear.com/media"
  ).replace(/\/$/, "");
}

function isFtpConfigured() {
  return Boolean(
    process.env.HOSTINGER_FTP_HOST &&
      process.env.HOSTINGER_FTP_USER &&
      process.env.HOSTINGER_FTP_PASSWORD
  );
}

function canWriteLocalMedia() {
  return process.env.VERCEL !== "1";
}

export function getProductImageUrl(objectPath) {
  if (!objectPath) return "";
  if (/^https?:\/\//i.test(objectPath) || objectPath.startsWith("/")) return objectPath;
  const hostinger = mediaBaseUrl();
  if (hostinger) return `${hostinger}/${objectPath.replace(/^\/+/, "")}`;
  const { url } = getSupabaseConfig();
  if (!url) return objectPath;
  return `${url}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${objectPath.replace(/^\/+/, "")}`;
}

async function ensurePublicBucket(supabase) {
  const { data } = await supabase.storage.getBucket(PRODUCT_IMAGE_BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(PRODUCT_IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
  });
  if (error && !/already exists/i.test(error.message || "")) {
    throw new AppError(storageErrorMessage(error), 500);
  }
}

async function uploadToHostingerFtp(bytes, folder, filename) {
  const { Client } = await import("basic-ftp");
  const client = new Client(25000);
  const remoteDir = `${String(process.env.HOSTINGER_REMOTE_DIR || "/public_html/media").replace(/\/$/, "")}/${folder}`;
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
  const base = mediaBaseUrl();
  const relative = `/media/${folder}/${filename}`;
  return base ? `${base}${relative}` : relative;
}

export async function uploadProductImage(productId, file, accessToken, folder = "products") {
  assertFile(file);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_BYTES) {
    throw new AppError("Image must be under 6MB.", 400);
  }

  const filename = `${Date.now()}-${crypto.randomUUID()}${extensionOf(file)}`;
  const safeRoot = ["products", "banners", "categories"].includes(folder)
    ? folder
    : "products";

  if (isFtpConfigured()) {
    const url = await uploadToHostingerFtp(bytes, safeRoot, filename);
    return { path: url, url };
  }

  if (canWriteLocalMedia() && (mediaBaseUrl() || process.env.NODE_ENV !== "production")) {
    const url = await uploadToLocalMedia(bytes, safeRoot, filename);
    return { path: url, url };
  }

  if (!isSupabaseConfigured()) {
    throw new AppError("Set Hostinger FTP or local media storage for image uploads.", 503);
  }

  const service = createServiceClient();
  const supabase = service || createUserClient(accessToken);
  if (!supabase) {
    throw new AppError("Unable to create a Storage client.", 500);
  }
  if (service) {
    await ensurePublicBucket(supabase);
  }

  const nested = productId ? `${safeRoot}/${productId}` : `${safeRoot}/draft`;
  const objectPath = `${nested}/${filename}`;
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(objectPath, bytes, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  throwIf(error, storageErrorMessage(error), 400);
  return {
    path: objectPath,
    url: getProductImageUrl(objectPath),
  };
}

export async function deleteProductImage(objectPath, accessToken) {
  if (!objectPath || /^https?:\/\//i.test(objectPath) || objectPath.startsWith("/")) {
    return false;
  }
  if (!isSupabaseConfigured()) {
    return false;
  }
  const supabase = createServiceClient() || createUserClient(accessToken);
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([objectPath]);
  throwIf(error, storageErrorMessage(error), 400);
  return true;
}
