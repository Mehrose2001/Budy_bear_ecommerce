import { formatPrice } from "@/lib/utils";

export function freeDeliveryAnnouncement(threshold) {
  const amount = Math.max(0, Math.round(Number(threshold) || 0));
  if (!amount) return "";
  return `Free Delivery on Orders Above ${formatPrice(amount)}`;
}

export function buildAnnouncementMessages(adminAnnouncement, freeDeliveryThreshold) {
  const custom = String(adminAnnouncement || "").trim();
  const dynamicFree = freeDeliveryAnnouncement(freeDeliveryThreshold);
  const extras = [
    "Cash on Delivery available across Pakistan",
    "Easy returns within 7 days",
    "New arrivals dropping every week",
  ].filter((message) => message.toLowerCase() !== custom.toLowerCase());

  const list = [];
  if (dynamicFree) list.push(dynamicFree);
  if (custom && custom.toLowerCase() !== dynamicFree.toLowerCase()) list.push(custom);
  list.push(...extras.filter((m) => !list.some((x) => x.toLowerCase() === m.toLowerCase())));
  return list.length ? list : extras;
}
