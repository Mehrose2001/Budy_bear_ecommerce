function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function weightOf(el) {
  const style = el.getAttribute?.("style") || "";
  const weight = ((style.match(/font-weight\s*:\s*([^;]+)/i) || [])[1] || "").trim().toLowerCase();
  const mso = ((style.match(/mso-bidi-font-weight\s*:\s*([^;]+)/i) || [])[1] || "").trim().toLowerCase();
  const explicit = /^(bold|bolder|[6-9]00)$/.test(weight);
  if (mso === "normal" && !explicit) return false;
  if (/^(normal|400|lighter)$/.test(weight)) return false;
  if (explicit) return true;
  return el.tagName === "B" || el.tagName === "STRONG";
}

function isBlockTag(tag) {
  return ["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "UL", "OL", "TABLE", "TR", "BLOCKQUOTE"].includes(tag);
}

function headingTag(el) {
  const tag = el.tagName;
  const cls = el.getAttribute("class") || "";
  if (tag === "H1" || tag === "H2" || /MsoHeading[12]|MsoTitle|heading\s*[12]/i.test(cls)) return "h2";
  if (tag === "H3" || tag === "H4" || tag === "H5" || tag === "H6" || /MsoHeading[3-6]|heading\s*[3-6]/i.test(cls)) return "h3";
  return "";
}

function listKind(el) {
  const text = el.textContent || "";
  const cls = el.getAttribute("class") || "";
  const numbered = /^\s*\d+[.)]\s+/.test(text) || /listnumber/i.test(cls);
  const bulleted = /^\s*[•·●▪‣]\s+/.test(text) || /msolist|listparagraph/i.test(cls);
  if (!numbered && !bulleted && el.tagName !== "LI") return "";
  return numbered ? "ol" : "ul";
}

function stripMarker(html) {
  return String(html || "")
    .replace(/^((?:\s|<[^>]+>)*)[•·●▪‣]\s+/, "$1")
    .replace(/^((?:\s|<[^>]+>)*)\d+[.)]\s+/, "$1")
    .trim();
}

function serializeInline(node, inheritedBold, blockEl, suppressFullBold) {
  let html = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      const text = escapeHtml(child.textContent);
      if (!text) return;
      html += inheritedBold ? `<strong>${text}</strong>` : text;
      return;
    }
    if (child.nodeType !== 1 || child.tagName === "STYLE" || child.tagName === "SCRIPT") return;
    if (child.tagName === "BR") {
      html += "<br />";
      return;
    }
    let bold = inheritedBold || weightOf(child);
    const coversBlock = (child.textContent || "").replace(/\s+/g, "") === (blockEl.textContent || "").replace(/\s+/g, "");
    const containsBlocks = child.querySelector?.("p, div, ul, ol, li, h1, h2, h3, table");
    if ((suppressFullBold && bold && coversBlock) || containsBlocks) bold = false;
    let inner = serializeInline(child, bold, blockEl, suppressFullBold);
    if (!inner) return;
    if (child.tagName === "A") {
      const href = child.getAttribute("href") || "";
      if (/^(https?:|mailto:|\/|#)/i.test(href)) inner = `<a href="${escapeHtml(href)}">${inner}</a>`;
    }
    const style = child.getAttribute("style") || "";
    if (child.tagName === "I" || child.tagName === "EM" || /font-style:\s*italic/i.test(style)) inner = `<em>${inner}</em>`;
    if (child.tagName === "U" || /text-decoration:[^;]*underline/i.test(style)) inner = `<u>${inner}</u>`;
    html += inner;
  });
  return html.replace(/<\/strong><strong>/g, "");
}

function coversWithBold(el) {
  const text = (el.textContent || "").replace(/\s+/g, "");
  if (!text) return false;
  const nodes = [...el.querySelectorAll("b, strong, span, font")].filter(weightOf);
  if (!nodes.length) return weightOf(el);
  const longest = nodes.reduce((max, node) => Math.max(max, (node.textContent || "").replace(/\s+/g, "").length), 0);
  return longest / text.length >= 0.9;
}

function collectBlocks(root) {
  const blocks = [];
  const visit = (node) => {
    if (node.nodeType !== 1) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        blocks.push({ type: "p", list: "", el: node.parentElement });
      }
      return;
    }
    const tag = node.tagName;
    if (tag === "UL" || tag === "OL") {
      [...node.children].forEach((child) => {
        if (child.tagName === "LI") blocks.push({ type: "li", list: tag === "OL" ? "ol" : "ul", el: child });
      });
      return;
    }
    if (tag === "LI") {
      blocks.push({ type: "li", list: listKind(node) || "ul", el: node });
      return;
    }
    const list = listKind(node);
    const heading = headingTag(node);
    if (heading || tag === "P" || list) {
      blocks.push({ type: list ? "li" : heading || "p", list: list || "ul", el: node });
      return;
    }
    const children = [...node.children];
    const hasBlock = children.some((child) => isBlockTag(child.tagName));
    if (tag === "BODY" || tag === "DIV" || hasBlock) {
      if ((tag === "DIV" || tag === "BLOCKQUOTE") && !hasBlock && node.textContent.trim()) {
        blocks.push({ type: "p", list: "", el: node });
        return;
      }
      [...node.childNodes].forEach(visit);
      return;
    }
    if (node.textContent.trim()) blocks.push({ type: "p", list: "", el: node });
  };
  [...root.childNodes].forEach(visit);
  return blocks.filter((block) => block.el && block.el.textContent.trim());
}

function renderBlocks(blocks) {
  const meaningful = blocks.filter((block) => block.el.textContent.trim());
  const fullBold = meaningful.filter((block) => coversWithBold(block.el));
  const suppressFullBold = meaningful.length > 1 && fullBold.length / meaningful.length >= 0.75;
  const html = [];
  let list = null;
  const flush = () => {
    if (!list) return;
    html.push(`<${list.type}>${list.items.join("")}</${list.type}>`);
    list = null;
  };
  blocks.forEach((block) => {
    const content = stripMarker(serializeInline(block.el, false, block.el, suppressFullBold));
    if (!content.replace(/<[^>]+>/g, "").trim()) return;
    if (block.type === "li") {
      const type = block.list || "ul";
      if (!list || list.type !== type) {
        flush();
        list = { type, items: [] };
      }
      list.items.push(`<li>${content}</li>`);
      return;
    }
    flush();
    html.push(`<${block.type}>${content}</${block.type}>`);
  });
  flush();
  return html.join("");
}

export function plainTextToHtml(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let list = null;
  const flush = () => {
    if (!list) return;
    html.push(`<${list.type}>${list.items.join("")}</${list.type}>`);
    list = null;
  };
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      return;
    }
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    const bullet = trimmed.match(/^[•·●▪‣*-]\s+(.+)$/);
    if (numbered || bullet) {
      const type = numbered ? "ol" : "ul";
      if (!list || list.type !== type) {
        flush();
        list = { type, items: [] };
      }
      list.items.push(`<li>${escapeHtml((numbered || bullet)[1])}</li>`);
      return;
    }
    flush();
    html.push(`<p>${escapeHtml(trimmed)}</p>`);
  });
  flush();
  return html.join("") || "<p></p>";
}

export function pastedHtmlToEditorHtml(html, plain) {
  const source = String(html || "");
  if (!source.trim() || typeof DOMParser === "undefined") return plainTextToHtml(plain || "");
  const doc = new DOMParser().parseFromString(source, "text/html");
  doc.querySelectorAll("style, script, meta, link, title").forEach((node) => node.remove());
  const rendered = renderBlocks(collectBlocks(doc.body));
  if (!rendered.replace(/<[^>]+>/g, "").trim()) return plainTextToHtml(plain || "");
  return rendered;
}
