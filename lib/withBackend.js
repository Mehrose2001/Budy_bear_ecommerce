import { NextResponse } from "next/server";
import { isApiConfigured, proxyToBackend } from "@/lib/backend";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AppError } from "@/lib/errors";

export function jsonError(error, fallbackStatus = 500) {
  const status = error?.status || fallbackStatus;
  return NextResponse.json(
    { error: error?.message || "Request failed." },
    { status }
  );
}

export async function withBackend(request, path, fallback) {
  if (isSupabaseConfigured()) {
    try {
      return await fallback();
    } catch (error) {
      return jsonError(error, error instanceof AppError ? error.status : 500);
    }
  }

  if (!isApiConfigured()) {
    try {
      return await fallback();
    } catch (error) {
      return jsonError(error, error instanceof AppError ? error.status : 500);
    }
  }

  try {
    const data = await proxyToBackend(request, path);
    return NextResponse.json(data, {
      status: request.method === "POST" && path === "/orders" ? 201 : 200,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "API unavailable." },
      { status: error.status || 503 }
    );
  }
}
