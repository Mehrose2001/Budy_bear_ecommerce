import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest, getAccessToken } from "@/lib/adminAuth";
import {
  deleteCategory as deleteMemoryCategory,
  listCategories as listMemoryCategories,
  upsertCategory as upsertMemoryCategory,
} from "@/lib/catalogStore";
import { withBackend } from "@/lib/withBackend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { invalidateCatalogSnapshot } from "@/lib/catalog";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryRecord,
  updateCategory,
} from "@/services/categoryService";

function refreshStoreCategories() {
  invalidateCatalogSnapshot();
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/products");
}

export async function GET(request) {
  return withBackend(request, "/admin/categories", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isSupabaseConfigured()) {
      const categories = await getCategories({
        includeInactive: true,
        accessToken: getAccessToken(request),
      });
      return NextResponse.json({ categories });
    }
    return NextResponse.json({ categories: listMemoryCategories() });
  });
}

export async function POST(request) {
  return withBackend(request, "/admin/categories", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
    }
    if (isSupabaseConfigured()) {
      const token = getAccessToken(request);
      const lookup = body.id || body.originalSlug || body.slug;
      const existing = lookup
        ? await getCategoryRecord(lookup, { includeInactive: true, accessToken: token })
        : null;
      const category = existing
        ? await updateCategory(existing.id, body, token)
        : await createCategory(body, token);
      refreshStoreCategories();
      return NextResponse.json({ category });
    }
    const category = upsertMemoryCategory(body);
    refreshStoreCategories();
    return NextResponse.json({ category });
  });
}

export async function DELETE(request) {
  return withBackend(request, "/admin/categories", async () => {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (isSupabaseConfigured()) {
      await deleteCategory(slug, getAccessToken(request));
      refreshStoreCategories();
      return NextResponse.json({ ok: true });
    }
    deleteMemoryCategory(slug);
    refreshStoreCategories();
    return NextResponse.json({ ok: true });
  });
}
