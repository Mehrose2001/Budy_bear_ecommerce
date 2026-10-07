import { brand } from "./brand.js";

export const LEGAL_PAGE_SLUGS = ["about", "privacy", "terms"];

export const LEGAL_PAGES = {
  about: {
    slug: "about",
    title: "About Budy Bear",
    href: "/about",
    intro: brand.slogan,
    body: `${brand.name} is a kidswear brand from ${brand.companyAddress}. We design clothing and accessories that feel soft, look cheerful, and keep up with everyday play — from first rompers to school-run outfits.

## What we stand for

- Comfort first: breathable fabrics and easy movement
- Honest sizing in months and years so parents can shop with confidence
- Cash on Delivery and support on WhatsApp across Pakistan

${brand.description} Explore Boys, Girls, Baby, Accessories, and Gifts on our [shop](/products), or say hello on [Contact Us](/contact).`,
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    href: "/privacy",
    intro: `This policy explains how ${brand.name} collects and uses your information when you shop with us.`,
    body: `## Information we collect

When you place an order or message us, we may collect:

- Name, phone number, email, and delivery address
- Order details, sizes, and product preferences
- Messages you send on WhatsApp or email
- Basic website usage such as pages visited (via cookies or analytics)

## How we use it

We use this information to:

- Process and deliver your orders
- Share shipping slips and order updates
- Answer questions and handle returns
- Improve our website, products, and service

## Sharing

We share details only with delivery partners and tools needed to run the store (for example, hosting). We do not sell your personal information.

## WhatsApp and email

Order confirmations and support may be sent on WhatsApp (${brand.whatsapp}) or email (${brand.supportEmail}). You can ask us to stop promotional messages at any time. Transactional order messages may still be required to complete a purchase.

## Data security and retention

We keep order records as long as needed for delivery, returns, and legal accounting. Please use a secure device when checking out.

## Your choices

You may request a copy, correction, or deletion of personal data we hold, subject to records we must keep for completed orders. Contact [${brand.supportEmail}](mailto:${brand.supportEmail}).

## Children

Our products are for children, but accounts and checkouts are for parents or guardians. We do not knowingly collect data directly from children.

See also our [Terms & Conditions](/terms).`,
  },
  terms: {
    slug: "terms",
    title: "Terms & Conditions",
    href: "/terms",
    intro: `Please read these terms before shopping with ${brand.name}. By placing an order on our website you agree to them.`,
    body: `## 1. Who we are

${brand.name} is a kidswear brand based in ${brand.companyAddress}. These terms apply to every order placed through our website.

## 2. Orders and acceptance

An order is an offer to buy. We may accept or decline an order if an item is out of stock, priced incorrectly, or we cannot deliver to your area. You will receive confirmation by WhatsApp or email after checkout.

## 3. Pricing and payment

All prices are in Pakistani Rupees (PKR) and include applicable taxes unless we say otherwise. We currently accept Cash on Delivery. Please keep the exact amount ready when the parcel arrives.

## 4. Product information

We try to show colours, fabrics, and sizes as accurately as possible. Small differences can happen because of screen settings or handmade details. Measurements are a guide — please check our [size guide](/size-guide) before you buy.

## 5. Delivery

Delivery timelines are estimates. Delays can happen due to courier operations, weather, or incomplete addresses. See [Shipping & Delivery](/shipping) for current options, including express service in Karachi and Sindh.

## 6. Returns

Unused items in original condition may be returned within 7 days. Baby innerwear and hygiene-sensitive pieces may not be returnable. Full details are on our [Returns & Exchanges](/returns) page.

## 7. Use of the website

You agree not to misuse the site, copy our product images or content without permission, or attempt to interfere with checkout or accounts.

## 8. Liability

${brand.name} is not responsible for indirect losses such as delay in a gift occasion, or issues caused by an incorrect address you provided. Nothing in these terms limits rights you have under Pakistani consumer law.

## 9. Changes

We may update these terms from time to time. The version on this page applies to new orders placed after the update.

## 10. Contact

Questions? Email [${brand.supportEmail}](mailto:${brand.supportEmail}) or WhatsApp ${brand.whatsapp}. You can also use our [contact page](/contact).`,
  },
};

export function getDefaultLegalPage(slug) {
  return LEGAL_PAGES[slug] || null;
}

export function mergeLegalPage(slug, saved) {
  const defaults = getDefaultLegalPage(slug);
  if (!defaults) return null;
  const intro = String(saved?.intro || "").trim();
  const body = String(saved?.body || "").trim();
  return {
    ...defaults,
    intro: intro || defaults.intro,
    body: body || defaults.body,
  };
}
