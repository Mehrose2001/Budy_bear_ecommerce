import { NextResponse } from "next/server";
import { isAdminRequest, getAccessToken } from "@/lib/adminAuth";
import {
  createProduct as createMemoryProduct,
  deleteProduct as deleteMemoryProduct,
  getProductById as getMemoryProduct,
  listProducts as listMemoryProducts,
  updateProduct as updateMemoryProduct,
} from "@/lib/catalogStore";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "@/services/productService";

export async function GET(request) {
  return withBackend(request, "/admin/products", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isSupabaseConfigured()) {
      const products = await getProducts({
        includeInactive: true,
        accessToken: getAccessToken(request),
      });
      return NextResponse.json({ products });
    }
    return NextResponse.json({ products: listMemoryProducts() });
  });
}

export async function POST(request) {
  return withBackend(request, "/admin/products", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const slug = String(body.slug || "").trim();
    if (!body.name || !body.category || !body.price) {
      return NextResponse.json({ error: "Name, category and price are required." }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }
    body.slug = slug;
    if (isSupabaseConfigured()) {
      const product = await createProduct(body, getAccessToken(request));
      return NextResponse.json({ product }, { status: 201 });
    }
    return NextResponse.json({ product: createMemoryProduct(body) }, { status: 201 });
  });
}

export async function PUT(request) {
  return withBackend(request, "/admin/products", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const slug = String(body.slug || "").trim();
    if (!slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }
    body.slug = slug;
    if (isSupabaseConfigured()) {
      const product = await updateProduct(body.id, body, getAccessToken(request));
      return NextResponse.json({ product });
    }
    const product = updateMemoryProduct(body.id, body);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  });
}

export async function DELETE(request) {
  return withBackend(request, "/admin/products", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (isSupabaseConfigured()) {
      const existing = await getProductById(id, {
        includeInactive: true,
        accessToken: getAccessToken(request),
      });
      if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      await deleteProduct(id, getAccessToken(request));
      return NextResponse.json({ ok: true });
    }
    const existing = getMemoryProduct(id);
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    deleteMemoryProduct(id);
    return NextResponse.json({ ok: true });
  });
}
