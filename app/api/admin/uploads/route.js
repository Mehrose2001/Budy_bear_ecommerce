import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }

  const type = file.type || "";
  const originalName = file.name || "upload.jpg";
  const ext = path.extname(originalName).toLowerCase() || ".jpg";

  if (!ALLOWED_TYPES.has(type) && !ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: "Upload a JPG, PNG, WEBP, GIF, or SVG image." },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > 6 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 6MB." }, { status: 400 });
  }

  const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);

  return NextResponse.json({ url: `/uploads/products/${filename}` });
}
