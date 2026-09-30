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

export function getProductImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  const { url } = getSupabaseConfig();
  if (!url) return path;
  return `${url}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path.replace(/^\/+/, "")}`;
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

export async function uploadProductImage(productId, file, accessToken) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase Storage is not configured.", 503);
  }
  assertFile(file);
  const service = createServiceClient();
  const supabase = service || createUserClient(accessToken);
  if (!supabase) {
    throw new AppError("Unable to create a Storage client.", 500);
  }
  if (service) {
    await ensurePublicBucket(supabase);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_BYTES) {
    throw new AppError("Image must be under 6MB.", 400);
  }

  const filename = `${Date.now()}-${crypto.randomUUID()}${extensionOf(file)}`;
  const folder = productId ? `products/${productId}` : "products/draft";
  const path = `${folder}/${filename}`;
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, bytes, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  throwIf(error, storageErrorMessage(error), 400);
  return {
    path,
    url: getProductImageUrl(path),
  };
}

export async function deleteProductImage(path, accessToken) {
  if (!path || /^https?:\/\//i.test(path) || path.startsWith("/")) {
    return false;
  }
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase Storage is not configured.", 503);
  }
  const supabase = createServiceClient() || createUserClient(accessToken);
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
  throwIf(error, storageErrorMessage(error), 400);
  return true;
}
