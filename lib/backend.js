const DEFAULT_TIMEOUT = 8000;

export function getApiBaseUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";
}

export function isApiConfigured() {
  return Boolean(getApiBaseUrl());
}

export async function backendFetch(path, init = {}) {
  const base = getApiBaseUrl();
  if (!base) {
    const error = new Error("API is not configured.");
    error.status = 503;
    throw error;
  }

  const timeoutMs = init.timeoutMs || DEFAULT_TIMEOUT;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(init.headers || {});
    const body = init.body;
    if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Buffer)) {
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${base}${path}`, {
      method: init.method || "GET",
      headers,
      body:
        body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Buffer)
          ? JSON.stringify(body)
          : body,
      signal: controller.signal,
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "Request failed");
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeout = new Error("The store is taking too long to respond. Please retry.");
      timeout.status = 504;
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function proxyToBackend(request, path, { timeoutMs = 20000 } = {}) {
  const method = request.method;
  const incomingType = request.headers.get("content-type") || "";
  const authorization = request.headers.get("authorization") || "";
  const headers = {};
  if (authorization) headers.Authorization = authorization;

  let body;
  if (method !== "GET" && method !== "HEAD") {
    if (incomingType.includes("multipart/form-data")) {
      body = await request.formData();
    } else {
      body = await request.json().catch(() => undefined);
      headers["Content-Type"] = "application/json";
    }
  }

  const search = new URL(request.url).search || "";
  return backendFetch(`${path}${search}`, {
    method,
    headers,
    body,
    timeoutMs,
  });
}
