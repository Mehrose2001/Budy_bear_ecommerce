import { NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { url, anonKey } = getSupabaseConfig();
  return NextResponse.json({
    ok: true,
    vercel: Boolean(process.env.VERCEL),
    vercelEnv: process.env.VERCEL_ENV || "",
    supabaseConfigured: isSupabaseConfigured(),
    supabaseUrlSet: Boolean(url),
    supabaseAnonSet: Boolean(anonKey),
  });
}
