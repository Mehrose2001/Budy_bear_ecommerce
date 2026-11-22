import { NextResponse } from "next/server";
import { extname } from "path";
import { mediaFileStat, readMediaFile, safeMediaRelative } from "@/lib/mediaRoot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".json": "application/json",
};

export async function GET(_request, { params }) {
  const segments = (await params)?.path || [];
  const relative = safeMediaRelative(segments.join("/"));
  if (!relative) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const info = await mediaFileStat(relative);
  const bytes = await readMediaFile(relative);
  if (!info || !bytes) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const type = TYPES[extname(relative).toLowerCase()] || "application/octet-stream";
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": type,
      "Content-Length": String(info.size),
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
