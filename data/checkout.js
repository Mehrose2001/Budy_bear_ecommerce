export const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
];

export const DELIVERY_METHODS = [
  {
    id: "standard",
    label: "Standard Delivery",
    detail: "3–6 working days across Pakistan",
  },
  {
    id: "express",
    label: "Express Delivery",
    detail: "1–2 working days — available only in Karachi, Sindh",
  },
];

export function isExpressAvailable(province, city) {
  const normalizedProvince = String(province || "").trim().toLowerCase();
  const normalizedCity = String(city || "").trim().toLowerCase();
  return normalizedProvince === "sindh" && normalizedCity === "karachi";
}

export const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Cash on Delivery",
    detail: "Pay in cash when your order arrives. Fully available now.",
    enabled: true,
  },
  {
    id: "card",
    label: "Debit / Credit card",
    detail: "Card checkout is coming soon and is currently unavailable.",
    enabled: false,
  },
];
