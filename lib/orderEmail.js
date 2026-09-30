import nodemailer from "nodemailer";
import { brand } from "@/data/brand";
import { formatPrice } from "@/lib/utils";
import { buildOrderWhatsAppMessage } from "@/lib/orderNotifications";

function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function smtpSettings() {
  const env = typeof process === "undefined" ? {} : process.env;
  const user = clean(env.SMTP_USER);
  const pass = clean(env.SMTP_PASS).replace(/\s+/g, "");
  const host = clean(env.SMTP_HOST) || "smtp.gmail.com";
  const port = Number(clean(env.SMTP_PORT) || 465);
  const to = clean(env.ORDER_NOTIFY_EMAIL) || brand.supportEmail;
  return { user, pass, host, port, to };
}

export function isSmtpConfigured() {
  const { user, pass } = smtpSettings();
  return Boolean(user && pass);
}

function itemRows(order) {
  return (order.items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #ead9c2;">${item.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #ead9c2;">${item.color || "-"} / ${item.size || "-"}</td>
          <td style="padding:8px 0;border-bottom:1px solid #ead9c2;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #ead9c2;text-align:right;">${formatPrice(item.unitPrice * item.quantity)}</td>
        </tr>`
    )
    .join("");
}

export async function sendOrderPlacedEmail(order) {
  const { user, pass, host, port, to } = smtpSettings();

  if (!user || !pass) {
    console.warn("Order email skipped: set SMTP_USER and SMTP_PASS on Vercel.");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    connectionTimeout: 15000,
    socketTimeout: 15000,
  });

  const customerName =
    order.shippingAddress?.fullName || order.customer?.fullName || "Customer";
  const text = buildOrderWhatsAppMessage(order, "admin");

  await transporter.sendMail({
    from: `"${brand.name}" <${user}>`,
    to,
    replyTo: order.customer?.email || undefined,
    subject: `New COD order ${order.id} — ${formatPrice(order.total)}`,
    text,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#16324f;max-width:640px;">
        <h2 style="margin:0 0 8px;">New Cash on Delivery order</h2>
        <p style="margin:0 0 16px;">${customerName} placed order <strong>${order.id}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px 0;border-bottom:2px solid #16324f;">Item</th>
              <th style="text-align:left;padding:8px 0;border-bottom:2px solid #16324f;">Details</th>
              <th style="text-align:left;padding:8px 0;border-bottom:2px solid #16324f;">Qty</th>
              <th style="text-align:right;padding:8px 0;border-bottom:2px solid #16324f;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows(order)}</tbody>
        </table>
        <p style="margin:16px 0 0;font-size:16px;"><strong>Collect on delivery: ${formatPrice(order.total)}</strong></p>
        <p style="margin:12px 0 0;font-size:13px;color:#3f4f63;">
          ${order.shippingAddress?.address || ""}<br />
          ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.province || ""} ${order.shippingAddress?.postalCode || ""}<br />
          Phone: ${order.customer?.phone || order.shippingAddress?.phone || ""}<br />
          Email: ${order.customer?.email || ""}
        </p>
      </div>
    `,
  });

  return true;
}
