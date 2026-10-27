import {
  accessTokenNeedsRenewal,
  emitAuthChanged,
  expireAdminSession,
  refreshAdminSession,
} from "@/lib/adminSession";

async function renewIfNeeded(token, retried) {
  if (retried || !accessTokenNeedsRenewal(token, Date.now(), 120_000)) return "";
  const next = await refreshAdminSession();
  if (!next?.token || next.token === token) return "";
  return next.token;
}

export async function adminFetch(url, options = {}, token = "") {
  if (!token) {
    expireAdminSession();
    emitAuthChanged();
    throw new Error("Admin session expired. Please sign in again.");
  }

  const { _retried, ...fetchOptions } = options;
  const response = await fetch(url, {
    ...fetchOptions,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(fetchOptions.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    const renewed = await renewIfNeeded(token, _retried);
    if (renewed) return adminFetch(url, { ...fetchOptions, _retried: true }, renewed);
    expireAdminSession();
    emitAuthChanged();
    throw new Error(data.error || "Admin session expired. Please sign in again.");
  }
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export async function adminUploadFile(file, token = "", productId = "", folder = "products") {
  if (!token) {
    expireAdminSession();
    emitAuthChanged();
    throw new Error("Admin session expired. Please sign in again.");
  }

  const body = new FormData();
  body.append("file", file);
  if (productId) body.append("productId", String(productId));
  if (folder) body.append("folder", folder);

  const response = await fetch("/api/admin/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    const renewed = await renewIfNeeded(token, false);
    if (renewed) return adminUploadFile(file, renewed, productId, folder);
    expireAdminSession();
    emitAuthChanged();
    throw new Error(data.error || "Admin session expired. Please sign in again.");
  }
  if (!response.ok) {
    throw new Error(data.error || data.message || `Upload failed (${response.status})`);
  }
  return data;
}
