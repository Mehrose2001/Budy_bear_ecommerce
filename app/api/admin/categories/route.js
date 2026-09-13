import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import {
  deleteCategory,
  listCategories,
  upsertCategory,
} from "@/lib/catalogStore";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ categories: listCategories() });
}

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (!body.name || !body.slug) {
    return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
  }
  return NextResponse.json({ category: upsertCategory(body) });
}

export async function DELETE(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  deleteCategory(searchParams.get("slug"));
  return NextResponse.json({ ok: true });
}
