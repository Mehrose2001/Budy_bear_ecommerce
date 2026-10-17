export function requestOrigin(request) {
  const configured = String(
    process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_ORIGIN || ""
  )
    .trim()
    .replace(/\/$/, "");
  if (configured) return configured;

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  if (!host) return "";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
