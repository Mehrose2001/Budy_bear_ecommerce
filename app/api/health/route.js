import { NextResponse } from "next/server";
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  getSupabaseEnvDebug,
} from "@/lib/supabase/config";
import { getServiceRoleKey } from "@/lib/supabase/secrets.server";
import { isSmtpConfigured } from "@/lib/orderEmail";
import {
  isMysqlConfigured,
  liveBackendName,
  useHostingerBackend,
} from "@/lib/backendMode";
import { isMediaRootConfigured, mediaRootPath } from "@/lib/mediaRoot";
import { pingMysql } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { url, anonKey } = getSupabaseConfig();
  const mysql = isMysqlConfigured() ? await pingMysql() : { ok: false, reason: "not_configured" };
  return NextResponse.json({
    ok: true,
    vercel: Boolean(process.env.VERCEL),
    vercelEnv: process.env.VERCEL_ENV || "",
    liveBackend: liveBackendName(),
    useHostingerBackend: useHostingerBackend(),
    supabaseConfigured: isSupabaseConfigured(),
    supabaseUrlSet: Boolean(url),
    supabaseAnonSet: Boolean(anonKey),
    env: getSupabaseEnvDebug(),
    hasServiceRoleKey: Boolean(getServiceRoleKey()),
    orderDeleteMode: Boolean(getServiceRoleKey())
      ? "service_role"
      : "admin_jwt_fallback",
    smtpConfigured: isSmtpConfigured(),
    mysqlConfigured: isMysqlConfigured(),
    mysqlOk: Boolean(mysql.ok),
    mysqlReason: mysql.ok ? "" : mysql.reason || "",
    mediaRootConfigured: isMediaRootConfigured(),
    mediaRootSet: Boolean(mediaRootPath()),
    jwtConfigured: Boolean(String(process.env.JWT_SECRET || "").trim()),
  });
}
