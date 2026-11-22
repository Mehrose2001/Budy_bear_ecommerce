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
import { pingMysql, queryOne } from "@/lib/db";
import { CODE_VERSION } from "@/lib/release";
import { importMissingSupabaseOrders, mysqlOrderCount } from "@/services/hostinger/importSupabaseOrders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { url, anonKey } = getSupabaseConfig();
  const mysql = isMysqlConfigured() ? await pingMysql() : { ok: false, reason: "not_configured" };
  let mysqlUserCount = null;
  let mysqlOrderCountValue = null;
  if (mysql.ok) {
    try {
      const row = await queryOne("SELECT COUNT(*) AS n FROM users");
      mysqlUserCount = Number(row?.n || 0);
    } catch {
      mysqlUserCount = null;
    }
    mysqlOrderCountValue = await mysqlOrderCount();
    if (useHostingerBackend() && mysqlOrderCountValue === 0) {
      try {
        await importMissingSupabaseOrders({ force: true });
        mysqlOrderCountValue = await mysqlOrderCount();
      } catch (error) {
        console.warn("Health order import skipped:", error?.message || error);
      }
    }
  }
  return NextResponse.json({
    ok: true,
    codeVersion: CODE_VERSION,
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
    mysqlUserCount,
    mysqlOrderCount: mysqlOrderCountValue,
    mediaRootConfigured: isMediaRootConfigured(),
    mediaRootSet: Boolean(mediaRootPath()),
    jwtConfigured: Boolean(String(process.env.JWT_SECRET || "").trim()),
  });
}
