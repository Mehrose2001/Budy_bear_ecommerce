import { AppError, throwIf } from "@/lib/errors";
import { createUserClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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
  if (file.size > MAX_BYTES) {
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

export function getProductImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return path;
  return `${url}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path.replace(/^\/+/, "")}`;
}

export async function uploadProductImage(productId, file, accessToken) {
  if (!isSupabaseConfigured()) {
    throw new AppError("Supabase Storage is not configured.", 503);
  }
  assertFile(file);
  const supabase = createUserClient(accessToken);
  const filename = `${Date.now()}-${crypto.randomUUID()}${extensionOf(file)}`;
  const folder = productId ? `products/${productId}` : "products/draft";
  const path = `${folder}/${filename}`;
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  throwIf(error, "Unable to upload image.");
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
  const supabase = createUserClient(accessToken);
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
  throwIf(error, "Unable to delete image.");
  return true;
}
