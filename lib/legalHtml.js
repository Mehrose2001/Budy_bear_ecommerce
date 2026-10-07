const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "div",
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "a",
  "font",
]);

export function looksLikeHtml(text) {
  return /<\/?[a-z][\s\S]*>/i.test(String(text || ""));
}

export function markdownToHtml(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let list = [];

  const inline = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_match, label, href) => `<a href="${String(href).replace(/"/g, "&quot;")}">${label}</a>`
      );

  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
    list = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }
    if (trimmed.startsWith("##")) {
      flushList();
      html.push(`<h2>${inline(trimmed.replace(/^##\s*/, ""))}</h2>`);
      return;
    }
    if (trimmed.startsWith("- ")) {
      list.push(trimmed.slice(2));
      return;
    }
    flushList();
    html.push(`<p>${inline(trimmed)}</p>`);
  });
  flushList();
  return html.join("");
}

export function editorHtml(text) {
  const value = String(text || "");
  if (!value.trim()) return "<p></p>";
  return looksLikeHtml(value) ? value : markdownToHtml(value);
}

function sanitizeStyle(style) {
  return String(style || "")
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .filter((rule) =>
      /^(font-size|font-family|font-weight|font-style|text-decoration|text-align|color|background-color)\s*:/i.test(
        rule
      )
    )
    .join("; ");
}

export function sanitizeHtml(dirty) {
  const source = String(dirty || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  return source.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag, attrs) => {
    const name = String(tag).toLowerCase();
    if (match.startsWith("</")) {
      return ALLOWED_TAGS.has(name) ? `</${name}>` : "";
    }
    if (!ALLOWED_TAGS.has(name)) return "";
    if (name === "br") return "<br />";

    let safeAttrs = "";
    const attrValue = (nameToFind) => {
      const found = attrs.match(new RegExp(`${nameToFind}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
      return found?.[2] || found?.[3] || found?.[4] || "";
    };

    if (name === "a") {
      const url = attrValue("href");
      if (/^(https?:\/\/|mailto:|\/|#)/i.test(url)) {
        safeAttrs += ` href="${url.replace(/"/g, "&quot;")}"`;
      }
    }
    if (name === "font") {
      const face = attrValue("face").replace(/["<>]/g, "");
      const color = attrValue("color");
      const size = attrValue("size").replace(/[^\d+-]/g, "");
      if (face) safeAttrs += ` face="${face}"`;
      if (/^#?[a-z0-9]+$/i.test(color) || /^rgb/i.test(color)) {
        safeAttrs += ` color="${color.replace(/"/g, "&quot;")}"`;
      }
      if (size) safeAttrs += ` size="${size}"`;
    }
    const style = attrs.match(/style\s*=\s*("([^"]*)"|'([^']*)')/i);
    const cleaned = sanitizeStyle(style?.[2] || style?.[3] || "");
    if (cleaned) safeAttrs += ` style="${cleaned.replace(/"/g, "&quot;")}"`;
    return `<${name}${safeAttrs}>`;
  });
}
