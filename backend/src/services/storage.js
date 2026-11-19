import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { Client } from "basic-ftp";
import { config, isFtpConfigured } from "../config.js";
import { HttpError } from "../lib/http.js";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);
const uploadsRoot = path.join(
  path.dirname(fileURLToPath(new URL(".", import.meta.url))),
  "..",
  "uploads"
);

export function assertImageFile(file) {
  if (!file) throw new HttpError(400, "Choose an image to upload.");
  const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
  if (!ALLOWED_TYPES.has(file.mimetype) && !ALLOWED_EXTENSIONS.has(ext)) {
    throw new HttpError(400, "Upload a JPG, PNG, WEBP, GIF, or SVG image.");
  }
  if (file.size > 6 * 1024 * 1024) {
    throw new HttpError(400, "Image must be under 6MB.");
  }
  return ext;
}

export async function storeImage(file, folder = "products") {
  const ext = assertImageFile(file);
  const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const buffer = file.buffer;

  if (isFtpConfigured()) {
    const client = new Client(25000);
    try {
      await client.access({
        host: config.ftp.host,
        user: config.ftp.user,
        password: config.ftp.password,
        port: config.ftp.port,
        secure: false,
      });
      const remoteDir = `${config.ftp.remoteDir.replace(/\/$/, "")}/${folder}`;
      await client.ensureDir(remoteDir);
      await client.uploadFrom(Readable.from(buffer), filename);
    } finally {
      client.close();
    }
    if (!config.ftp.publicBaseUrl) {
      throw new HttpError(
        500,
        "Set HOSTINGER_PUBLIC_BASE_URL so uploaded images can be loaded."
      );
    }
    return `${config.ftp.publicBaseUrl}/${folder}/${filename}`;
  }

  if (config.nodeEnv === "production") {
    throw new HttpError(
      503,
      "Set HOSTINGER_FTP_HOST, HOSTINGER_FTP_USER, and HOSTINGER_FTP_PASSWORD. New images are stored on Hostinger."
    );
  }

  const dir = path.join(uploadsRoot, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `${config.publicApiUrl}/media/${folder}/${filename}`;
}

export { uploadsRoot };
