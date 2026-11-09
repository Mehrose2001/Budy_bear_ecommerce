import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

function parseStoreJsonField(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value;
  return null;
}

function normalizeDeliverySettings(input) {
  const rawFee = input?.deliveryFee ?? input?.delivery_fee;
  const rawThreshold = input?.freeDeliveryThreshold ?? input?.free_delivery_threshold;
  return {
    deliveryFee: Math.max(0, Math.round(Number(rawFee ?? 249))),
    freeDeliveryThreshold: Math.max(0, Math.round(Number(rawThreshold ?? 3000))),
  };
}

const envText = readFileSync(".env.local", "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const index = line.indexOf("=");
  if (index === -1) continue;
  env[line.slice(0, index)] = line.slice(index + 1).trim();
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await supabase
  .from("store_settings")
  .select("legal_pages, delivery_fee, free_delivery_threshold")
  .eq("id", 1)
  .maybeSingle();

console.log("error:", error?.message || null);
const legal = parseStoreJsonField(data?.legal_pages) || {};
const embedded =
  legal._delivery && typeof legal._delivery === "object" ? legal._delivery : {};
console.log("embedded:", embedded);
console.log(
  "normalized:",
  normalizeDeliverySettings({
    deliveryFee: embedded.deliveryFee ?? data?.delivery_fee,
    freeDeliveryThreshold: embedded.freeDeliveryThreshold ?? data?.free_delivery_threshold,
  })
);
