import { ADMIN_TOKEN } from "@/data/admin";

export function isAdminRequest(request) {
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${ADMIN_TOKEN}`;
}
