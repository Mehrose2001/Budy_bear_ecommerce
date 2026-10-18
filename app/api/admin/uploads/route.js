import path from "path";
import { NextResponse } from "next/server";
import { isAdminRequest, getAccessToken } from "@/lib/adminAuth";
import { withBackend } from "@/lib/withBackend";
import { uploadProductImage } from "@/services/storageService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);

export async function POST(request) {
  return withBackend(request, "/admin/uploads", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const productId = formData.get("productId") || "";
    const folder = String(formData.get("folder") || "products");

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

    const uploaded = await uploadProductImage(
      productId,
      file,
      getAccessToken(request),
      folder
    );
    return NextResponse.json(uploaded);
  });
}
