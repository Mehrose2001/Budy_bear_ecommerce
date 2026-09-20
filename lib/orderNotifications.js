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
Email: ${brand.supportEmail}

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOrderSlipHtml(order, logoSrc = brand.logo) {
  const items = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
          </td>
          <td>${escapeHtml(item.color || "-")} · ${escapeHtml(item.size || "-")}</td>
          <td>${item.quantity}</td>
          <td>${formatPrice(item.unitPrice)}</td>
          <td class="amount">${formatPrice(item.unitPrice * item.quantity)}</td>
        </tr>`
    )
    .join("");

  const dateLabel = new Date(order.createdAt).toLocaleString("en-PK");
  const receiverName = escapeHtml(
    order.shippingAddress?.fullName || order.customer?.fullName || ""
  );
  const receiverPhone = escapeHtml(
    order.customer?.phone || order.shippingAddress?.phone || ""
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(brand.name)} receipt ${escapeHtml(order.id)}</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; background: #f7efe4; font-family: Arial, Helvetica, sans-serif; color: #16324f; }
    .sheet { max-width: 760px; margin: 24px auto; background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 16px 40px rgb(22 50 79 / 0.12); }
    .header { display: flex; gap: 16px; align-items: center; padding: 24px 28px; background: #16324f; color: #fff; }
    .logo { width: 72px; height: 72px; border-radius: 999px; object-fit: cover; background: #fff; border: 3px solid #d4a017; }
    .tag { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #d4a017; font-weight: 700; }
    h1 { margin: 4px 0 0; font-size: 26px; }
    .meta { margin: 4px 0 0; color: rgba(255,255,255,0.75); font-size: 13px; }
    .badge { margin-left: auto; background: #d4a017; color: #0f2744; font-size: 11px; font-weight: 800; padding: 8px 12px; border-radius: 999px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 22px 28px; border-bottom: 1px solid #ead9c2; }
    .label { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #d4a017; }
    .parties h2 { margin: 6px 0 4px; font-size: 16px; }
    .parties p { margin: 0; font-size: 13px; color: #3f4f63; line-height: 1.55; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #16324f; padding: 10px 8px; border-bottom: 2px solid #16324f; }
    td { padding: 12px 8px; border-bottom: 1px solid #f0e6d8; font-size: 13px; vertical-align: top; }
    .amount { text-align: right; font-weight: 700; }
    .pad { padding: 8px 28px 24px; }
    .totals { width: 280px; margin-left: auto; font-size: 13px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; color: #3f4f63; }
    .totals .grand { margin-top: 8px; padding-top: 10px; border-top: 2px solid #16324f; color: #16324f; font-size: 16px; font-weight: 800; }
    .footer { background: #f7efe4; text-align: center; padding: 16px; font-size: 12px; color: #5b6b7c; }
    @media print {
      body { background: #fff; }
      .sheet { margin: 0; box-shadow: none; border-radius: 0; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <img class="logo" src="${logoSrc}" alt="${escapeHtml(brand.name)} logo" />
      <div>
        <div class="tag">${escapeHtml(brand.tagline)}</div>
        <h1>${escapeHtml(brand.name)} receipt</h1>
        <p class="meta">Order ${escapeHtml(order.id)} · ${escapeHtml(dateLabel)}</p>
      </div>
      <div class="badge">Cash on Delivery</div>
    </div>
    <div class="parties">
      <div>
        <div class="label">Sender</div>
        <h2>${escapeHtml(brand.name)}</h2>
        <p>${escapeHtml(brand.companyAddress)}</p>
        <p>Phone: ${escapeHtml(brand.supportPhone)}</p>
        <p>Email: ${escapeHtml(brand.supportEmail)}</p>
      </div>
      <div>
        <div class="label">Receiver</div>
        <h2>${receiverName}</h2>
        <p>
          ${escapeHtml(order.shippingAddress?.address || "")}<br />
          ${escapeHtml(order.shippingAddress?.city || "")}, ${escapeHtml(order.shippingAddress?.province || "")} ${escapeHtml(order.shippingAddress?.postalCode || "")}
        </p>
        <p>Phone: ${receiverPhone}</p>
      </div>
    </div>
    <div class="pad">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Details</th>
            <th>Qty</th>
            <th>Price</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>${items}</tbody>
      </table>
      <div class="totals">
        <div><span>Subtotal</span><span>${formatPrice(order.subtotal)}</span></div>
        <div><span>Discount</span><span>-${formatPrice(order.discount)}</span></div>
        <div><span>Delivery</span><span>${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span></div>
        <div class="grand"><span>Collect on delivery</span><span>${formatPrice(order.total)}</span></div>
      </div>
    </div>
    <div class="footer">Thank you for shopping with ${escapeHtml(brand.name)}. Status: ${escapeHtml(order.orderStatus || "Confirmed")}.</div>
  </div>
</body>
</html>`;
}

async function logoDataUrl() {
  if (typeof window === "undefined") return brand.logo;
  try {
    const response = await fetch(brand.logo);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return brand.logo;
  }
}

export async function downloadOrderSlip(order) {
  if (typeof window === "undefined" || !order) return;
  const logoSrc = await logoDataUrl();
  const blob = new Blob([buildOrderSlipHtml(order, logoSrc)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.id}-receipt.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
