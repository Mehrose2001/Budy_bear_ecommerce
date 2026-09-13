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
    detail: "1–2 working days in major cities",
  },
];

export const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Cash on Delivery",
    detail: "Pay in cash when your order arrives. Fully available now.",
    enabled: true,
  },
  {
    id: "bank-transfer",
    label: "Bank Transfer",
    detail: "Transfer to our account and keep the receipt for confirmation.",
    enabled: true,
  },
  {
    id: "online",
    label: "Online Payment",
    detail: "Card and wallet checkout is coming soon.",
    enabled: false,
  },
];

export const BANK_DETAILS = {
  accountTitle: "Budy Bear Kids Wear",
  bank: "Meezan Bank",
  accountNumber: "01234567890123",
  iban: "PK12MEZN0000001234567890",
};
