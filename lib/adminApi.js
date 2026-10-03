import { emitAuthChanged, expireAdminSession } from "@/lib/adminSession";

export async function adminFetch(url, options = {}, token = "") {
  if (!token) {
    expireAdminSession();
    emitAuthChanged();
    throw new Error("Admin session expired. Please sign in again.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
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
    expireAdminSession();
    emitAuthChanged();
    throw new Error(data.error || "Admin session expired. Please sign in again.");
  }
  if (!response.ok) {
    throw new Error(data.error || data.message || `Upload failed (${response.status})`);
  }
  return data;
}
