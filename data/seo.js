import { brand } from "./brand.js";

export const ROBOTS_OPTIONS = [
  "index, follow",
  "index, nofollow",
  "noindex, follow",
  "noindex, nofollow",
];

export const TWITTER_CARDS = ["summary_large_image", "summary"];

export const SEO_PAGES = [
  { key: "about", label: "About Budy Bear", path: "/about" },
  { key: "contact", label: "Contact Us", path: "/contact" },
  { key: "products", label: "Shop / All Products", path: "/products" },
  { key: "shipping", label: "Shipping & Delivery", path: "/shipping" },
  { key: "privacy", label: "Privacy Policy", path: "/privacy" },
  { key: "terms", label: "Terms & Conditions", path: "/terms" },
];

const PAGE_KEYS = SEO_PAGES.map((page) => page.key);

export function emptyEntry() {
  return { title: "", description: "", keyword: "", canonical: "", image: "" };
}

export function emptySocial() {
  return {
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: "",
    twitterCard: "summary_large_image",
  };
}

export function emptySeo() {
  return {
    title: "",
    description: "",
    keywords: "",
    logo: "",
    image: "",
    canonicalBase: "",
    robots: "index, follow",
    home: emptyEntry(),
    social: emptySocial(),
    pages: Object.fromEntries(PAGE_KEYS.map((key) => [key, emptyEntry()])),
    entities: { products: {}, categories: {}, subcategories: {} },
  };
}

function text(value, limit = 300) {
  return String(value || "").trim().slice(0, limit);
}

export function normalizeEntry(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    title: text(source.title, 180),
    description: text(source.description, 320),
    keyword: text(source.keyword || source.keywords, 180),
    canonical: text(source.canonical, 300),
    image: text(source.image, 500),
  };
}

function normalizeMap(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => key && !key.startsWith("_"))
      .map(([key, entry]) => [key, normalizeEntry(entry)])
  );
}

export function entryHasContent(entry) {
  const value = normalizeEntry(entry);
  return Boolean(value.title || value.description || value.keyword || value.canonical || value.image);
}

export function normalizeSeo(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const pages = source.pages && typeof source.pages === "object" ? source.pages : {};
  const entities = source.entities && typeof source.entities === "object" ? source.entities : {};
  const robots = ROBOTS_OPTIONS.includes(source.robots) ? source.robots : "index, follow";
  const card = TWITTER_CARDS.includes(source.social?.twitterCard)
    ? source.social.twitterCard
    : "summary_large_image";
  return {
    title: text(source.title, 180),
    description: text(source.description, 320),
    keywords: text(source.keywords, 300),
    logo: text(source.logo, 500),
    image: text(source.image, 500),
    canonicalBase: text(source.canonicalBase || source.canonical_base, 300).replace(/\/$/, ""),
    robots,
    home: normalizeEntry(source.home),
    social: {
      ogTitle: text(source.social?.ogTitle, 180),
      ogDescription: text(source.social?.ogDescription, 320),
      ogImage: text(source.social?.ogImage, 500),
      twitterTitle: text(source.social?.twitterTitle, 180),
      twitterDescription: text(source.social?.twitterDescription, 320),
      twitterImage: text(source.social?.twitterImage, 500),
      twitterCard: card,
    },
    pages: Object.fromEntries(PAGE_KEYS.map((key) => [key, normalizeEntry(pages[key])])),
    entities: {
      products: normalizeMap(entities.products),
      categories: normalizeMap(entities.categories),
      subcategories: normalizeMap(entities.subcategories),
    },
  };
}

export function seoHasContent(value) {
  const seo = normalizeSeo(value);
  if (seo.title || seo.description || seo.keywords || seo.logo || seo.image || seo.canonicalBase) {
    return true;
  }
  if (entryHasContent(seo.home) || entryHasContent(seo.social)) return true;
  return (
    Object.values(seo.pages).some(entryHasContent) ||
    Object.values(seo.entities.products).some(entryHasContent) ||
    Object.values(seo.entities.categories).some(entryHasContent) ||
    Object.values(seo.entities.subcategories).some(entryHasContent)
  );
}

export function withEntitySeo(seo, group, key, entry) {
  const next = normalizeSeo(seo);
  if (!key || !next.entities[group]) return next;
  next.entities[group][key] = normalizeEntry(entry);
  return next;
}

export function isMissingColumn(error, column) {
  const message = String(error?.message || error?.details || error || "");
  return new RegExp(column, "i").test(message) && /column|schema cache|could not find/i.test(message);
}

export function siteBase(seo) {
  const candidate = String(
    seo?.canonicalBase || process.env.NEXT_PUBLIC_SITE_URL || "https://budybear.com"
  )
    .trim()
    .replace(/\/$/, "");
  try {
    const url = new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`);
    return `${url.origin}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return "https://budybear.com";
  }
}

export function absoluteUrl(base, value) {
  const path = String(value || "").trim();
  if (!path) return `${base}/`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function first(...values) {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

export function splitKeywords(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseRobots(value) {
  const text = String(value || "index, follow").toLowerCase();
  return {
    index: !text.includes("noindex"),
    follow: !text.includes("nofollow"),
  };
}

export function chooseEntry(primary, fallback) {
  if (entryHasContent(primary)) return normalizeEntry(primary);
  if (entryHasContent(fallback)) return normalizeEntry(fallback);
  return normalizeEntry(primary);
}

const DEFAULT_DESCRIPTION = `${brand.slogan} Shop premium kids clothing and accessories. Free delivery on orders above Rs. 3,000 across Pakistan.`;

export function buildMetadata({
  seo,
  entry,
  path = "/",
  fallbackTitle = "",
  fallbackDescription = "",
  fallbackImage = "",
  home = false,
}) {
  const settings = normalizeSeo(seo);
  const page = normalizeEntry(entry);
  const base = siteBase(settings);
  const title = home
    ? first(page.title, settings.title, fallbackTitle, `${brand.name} | Premium Kids Wear`)
    : first(page.title, fallbackTitle, settings.title, brand.name);
  const description = home
    ? first(page.description, settings.description, fallbackDescription, DEFAULT_DESCRIPTION)
    : first(page.description, fallbackDescription, settings.description, DEFAULT_DESCRIPTION);
  const canonical = absoluteUrl(base, page.canonical || path);
  const image = first(
    page.image,
    fallbackImage,
    home ? settings.social.ogImage : "",
    settings.social.ogImage,
    settings.image,
    settings.logo,
    brand.logo
  );
  const imageUrl = absoluteUrl(base, image);
  const ogTitle = first(home ? settings.social.ogTitle : "", page.title, fallbackTitle, settings.social.ogTitle, title);
  const ogDescription = first(
    home ? settings.social.ogDescription : "",
    page.description,
    fallbackDescription,
    settings.social.ogDescription,
    description
  );
  const twitterTitle = first(
    home ? settings.social.twitterTitle : "",
    page.title,
    fallbackTitle,
    settings.social.twitterTitle,
    ogTitle
  );
  const twitterDescription = first(
    home ? settings.social.twitterDescription : "",
    page.description,
    fallbackDescription,
    settings.social.twitterDescription,
    ogDescription
  );
  const twitterImage = absoluteUrl(
    base,
    first(
      home ? settings.social.twitterImage : "",
      page.image,
      fallbackImage,
      settings.social.twitterImage,
      image
    )
  );
  const siteKeywords = splitKeywords(settings.keywords);
  const keywords = [
    ...new Set([
      ...(siteKeywords.length
        ? siteKeywords
        : ["kids wear", "children clothing", "kids fashion Pakistan", brand.name]),
      ...splitKeywords(page.keyword),
    ]),
  ];

  return {
    title: home ? { absolute: title } : title,
    description,
    keywords,
    alternates: { canonical },
    robots: parseRobots(settings.robots),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: brand.name,
      locale: "en_PK",
      type: "website",
      images: imageUrl ? [{ url: imageUrl, alt: ogTitle || brand.name }] : undefined,
    },
    twitter: {
      card: settings.social.twitterCard || "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      images: twitterImage ? [twitterImage] : undefined,
    },
  };
}

export function lengthWarning(label, value, min, max) {
  const length = String(value || "").trim().length;
  if (!length) return `${label} is empty. The site will use its current fallback.`;
  if (length < min || length > max) {
    return `${label} is ${length} characters. ${min}–${max} is the usual range.`;
  }
  return "";
}

export function duplicateTitleWarnings(pairs) {
  const seen = new Map();
  const warnings = [];
  pairs.forEach(({ label, title }) => {
    const key = String(title || "").trim().toLowerCase();
    if (!key) return;
    if (seen.has(key)) warnings.push(`${label} uses the same title as ${seen.get(key)}.`);
    else seen.set(key, label);
  });
  return warnings;
}

export function organizationJsonLd(seo) {
  const settings = normalizeSeo(seo);
  const base = siteBase(settings);
  const logo = absoluteUrl(base, first(settings.logo, brand.logo));
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: `${base}/`,
    logo,
    description: first(settings.description, brand.description),
    email: brand.supportEmail,
    telephone: brand.supportPhone,
  };
}

export function productJsonLd(product, seo) {
  if (!product) return null;
  const settings = normalizeSeo(seo);
  const base = siteBase(settings);
  const entry = chooseEntry(product.seo, settings.entities.products[product.slug]);
  const image = first(entry.image, product.images?.[0], settings.image, brand.logo);
  const price = Number(product.salePrice ?? product.price ?? 0);
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: first(entry.title, product.name),
    description: first(entry.description, product.description),
    image: image ? [absoluteUrl(base, image)] : undefined,
    sku: String(product.id || product.slug || ""),
    brand: { "@type": "Brand", name: product.brand || brand.name },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(base, entry.canonical || `/product/${product.slug}`),
      priceCurrency: "PKR",
      price: Number.isFinite(price) ? price.toFixed(2) : "0.00",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
  if (Number(product.reviewCount) > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.rating) || 0,
      reviewCount: Number(product.reviewCount) || 0,
    };
  }
  return data;
}

export function breadcrumbJsonLd(items, seo) {
  const base = siteBase(seo);
  const list = (items || []).filter((item) => item?.label);
  if (!list.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(base, item.href) } : {}),
    })),
  };
}
