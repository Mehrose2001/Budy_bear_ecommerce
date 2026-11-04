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

function boldStyle(attrs) {
  const style = (String(attrs || "").match(/style\s*=\s*("([^"]*)"|'([^']*)')/i) || []).slice(2).find(Boolean) || "";
  const weight = ((style.match(/font-weight\s*:\s*([^;]+)/i) || [])[1] || "").trim().toLowerCase();
  const mso = ((style.match(/mso-bidi-font-weight\s*:\s*([^;]+)/i) || [])[1] || "").trim().toLowerCase();
  return {
    explicit: /^(bold|bolder|[6-9]00)$/.test(weight),
    normal: /^(normal|400|lighter)$/.test(weight) || (mso === "normal" && !/^(bold|bolder|[6-9]00)$/.test(weight)),
  };
}

function unwrapFalseBold(html) {
  let source = String(html || "");
  const innermost = /<(b|strong)\b([^>]*)>((?:(?!<\/?(?:b|strong)\b)[\s\S])*?)<\/\1>/gi;
  let guard = 0;
  let changed = true;
  while (changed && guard < 20) {
    changed = false;
    guard += 1;
    source = source.replace(innermost, (match, tag, attrs, inner) => {
      const weight = boldStyle(attrs);
      const wrapsBlocks = /<(p|div|h1|h2|h3|ul|ol|li|table|blockquote)\b/i.test(inner);
      if (weight.normal || wrapsBlocks) {
        changed = true;
        return inner;
      }
      return match;
    });
  }

  const blocks = [...source.matchAll(/<(p|li|div)\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  const filled = blocks.filter((match) => match[2].replace(/<[^>]+>/g, "").trim());
  const fullyBold = filled.filter((match) => {
    const wrapped = match[2].trim().match(/^<(b|strong)\b([^>]*)>([\s\S]*)<\/\1>$/i);
    return Boolean(wrapped) && !boldStyle(wrapped[2]).explicit && !/<(b|strong)\b/i.test(wrapped[3]);
  });
  if (filled.length >= 2 && fullyBold.length / filled.length >= 0.75) {
    source = source.replace(
      /<(p|li|div)(\b[^>]*)>\s*<(b|strong)\b(?![^>]*font-weight\s*:\s*(?:bold|bolder|[6-9]00))[^>]*>([\s\S]*?)<\/\3>\s*<\/\1>/gi,
      "<$1$2>$4</$1>"
    );
  }
  return source;
}

export function editorHtml(text) {
  const value = String(text || "");
  if (!value.trim()) return "<p></p>";
  const html = looksLikeHtml(value) ? value : markdownToHtml(value);
  return sanitizeHtml(html) || "<p></p>";
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
  const source = unwrapFalseBold(String(dirty || ""))
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
