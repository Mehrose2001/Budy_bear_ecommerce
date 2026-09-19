import { brand } from "@/data/brand";
import { formatPrice } from "@/lib/utils";

export function toWhatsAppNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("3")) return `92${digits}`;
  return digits;
}

export function getWhatsAppChatUrl(message = "") {
  const number = toWhatsAppNumber(brand.whatsapp);
  const text = encodeURIComponent(message);
  return `https://wa.me/${number}${text ? `?text=${text}` : ""}`;
}

function itemLines(order) {
  return (order.items || [])
    .map(
      (item) =>
        `- ${item.name} (${item.color || "-"} / ${item.size || "-"}) x${item.quantity} = ${formatPrice(item.unitPrice * item.quantity)}`
    )
    .join("\n");
}

export function buildOrderWhatsAppMessage(order, audience = "admin") {
  const customerName =
    order.shippingAddress?.fullName || order.customer?.fullName || "there";
  const details = `Order ID: ${order.id}
Payment: Cash on Delivery (${order.paymentStatus || "Unpaid"})
Total: ${formatPrice(order.total)}
Date: ${new Date(order.createdAt).toLocaleString("en-PK")}

Sender (Company)
${brand.name}
${brand.companyAddress}
Phone: ${brand.supportPhone}
WhatsApp: ${brand.whatsapp}

Receiver
${order.shippingAddress?.fullName || order.customer?.fullName}
${order.shippingAddress?.address}
${order.shippingAddress?.city}, ${order.shippingAddress?.province} ${order.shippingAddress?.postalCode || ""}
Phone: ${order.customer?.phone || order.shippingAddress?.phone}

Items
${itemLines(order)}`;

  if (audience === "customer") {
    return `Hi ${customerName} 👋,
Here is your Cash on Delivery order slip.

${details}

Thank you for shopping with ${brand.name}.`.trim();
  }

  return `New Cash on Delivery order for shipment.

${details}`.trim();
}

export function notifyOrderOnWhatsApp(order) {
  if (typeof window === "undefined" || !order) return;

  const adminUrl = `https://wa.me/${toWhatsAppNumber(brand.whatsapp)}?text=${encodeURIComponent(
    buildOrderWhatsAppMessage(order, "admin")
  )}`;
  window.open(adminUrl, "_blank", "noopener,noreferrer");

  const customerNumber = toWhatsAppNumber(order.customer?.phone || order.shippingAddress?.phone);
  if (!customerNumber) return;

  const customerUrl = `https://wa.me/${customerNumber}?text=${encodeURIComponent(
    buildOrderWhatsAppMessage(order, "customer")
  )}`;
  window.setTimeout(() => {
    window.open(customerUrl, "_blank", "noopener,noreferrer");
  }, 500);
}

export function buildOrderSlipHtml(order) {
  const items = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td>${item.name}<br /><small>${item.color || "-"} · ${item.size || "-"}</small></td>
          <td>${item.quantity}</td>
          <td>${formatPrice(item.unitPrice)}</td>
          <td>${formatPrice(item.unitPrice * item.quantity)}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${order.id} shipping slip</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 32px; }
    h1, h2 { margin: 0 0 8px; }
    .muted { color: #555; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .box { border: 1px solid #d4d4d4; border-radius: 12px; padding: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border-bottom: 1px solid #e5e5e5; text-align: left; padding: 8px; vertical-align: top; }
    .total { font-size: 18px; font-weight: 800; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <h1>${brand.name} shipping slip</h1>
  <p class="muted">Order ID: <strong>${order.id}</strong> · ${new Date(order.createdAt).toLocaleString("en-PK")}</p>
  <p>Payment: Cash on Delivery · Status: ${order.orderStatus || "Confirmed"}</p>
  <div class="grid">
    <div class="box">
      <h2>Sender (company)</h2>
      <p>${brand.name}<br />${brand.companyAddress}<br />${brand.supportPhone}<br />WhatsApp: ${brand.whatsapp}<br />${brand.supportEmail}</p>
    </div>
    <div class="box">
      <h2>Receiver</h2>
      <p>
        ${order.shippingAddress?.fullName || order.customer?.fullName}<br />
        ${order.shippingAddress?.address}<br />
        ${order.shippingAddress?.city}, ${order.shippingAddress?.province} ${order.shippingAddress?.postalCode || ""}<br />
        ${order.customer?.phone || order.shippingAddress?.phone}
      </p>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
    </thead>
    <tbody>${items}</tbody>
  </table>
  <p class="total">Collect on delivery: ${formatPrice(order.total)}</p>
</body>
</html>`;
}

export function downloadOrderSlip(order) {
  if (typeof window === "undefined" || !order) return;
  const blob = new Blob([buildOrderSlipHtml(order)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.id}-shipping-slip.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
