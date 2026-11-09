import { brand } from "@/data/brand";

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToPlainLines(fragment) {
  return decodeHtmlEntities(
    String(fragment || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function pickFirstMatch(html, patterns) {
  for (const pattern of patterns) {
    const match = String(html || "").match(pattern);
    if (match) {
      const value = decodeHtmlEntities((match[1] || match[2] || "").trim());
      if (value) return value;
    }
  }
  return "";
}

function extractRegisteredOfficeAddress(html) {
  const block = pickFirstMatch(html, [
    /<h2[^>]*>\s*registered office\s*<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/i,
    /registered office<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/i,
  ]);
  if (block) {
    return htmlToPlainLines(block).join("\n");
  }
  return "";
}

/** Parse sender block from merged Contact Us page (same source as storefront Contact page). */
export function senderFromContactPage(page) {
  const html = [page?.intro, page?.body].filter(Boolean).join("\n");
  const plainAddress = extractRegisteredOfficeAddress(html);

  const phone = pickFirstMatch(html, [
    /whatsapp\s*\/\s*phone:?<\/strong>\s*([^<]+)/i,
    /whatsapp[^:]*:\s*([^<]+)/i,
    /phone:?<\/strong>\s*([^<]+)/i,
  ]);
  const email = pickFirstMatch(html, [
    /href="mailto:([^"]+)"/i,
    /email:?<\/strong>\s*([^<]+)/i,
  ]).replace(/^mailto:/i, "");

  let companyName = brand.name;
  const addressLines = htmlToPlainLines(plainAddress);
  let streetAddress = plainAddress || brand.companyAddress;
  if (addressLines[0] && /limited|ltd|private|pvt/i.test(addressLines[0])) {
    companyName = addressLines[0];
    if (addressLines.length > 1) {
      streetAddress = addressLines.slice(1).join("\n");
    }
  }

  return {
    companyName,
    address: streetAddress,
    phone: phone || brand.supportPhone,
    email: email || brand.supportEmail,
  };
}

export function formatSenderAddress(sender) {
  return String(sender?.address || brand.companyAddress)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}
