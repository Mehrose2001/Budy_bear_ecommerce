import Link from "next/link";

function Inline({ text }) {
  const parts = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const href = match[2];
    const label = match[1];
    if (href.startsWith("/")) {
      parts.push(
        <Link key={key} href={href}>
          {label}
        </Link>
      );
    } else {
      parts.push(
        <a key={key} href={href}>
          {label}
        </a>
      );
    }
    key += 1;
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

export default function LegalBody({ text }) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const nodes = [];
  let list = [];

  const flushList = () => {
    if (!list.length) return;
    nodes.push(
      <ul key={`list-${nodes.length}`}>
        {list.map((item, index) => (
          <li key={index}>
            <Inline text={item} />
          </li>
        ))}
      </ul>
    );
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
      nodes.push(<h2 key={`h-${nodes.length}`}>{trimmed.replace(/^##\s*/, "")}</h2>);
      return;
    }
    if (trimmed.startsWith("- ")) {
      list.push(trimmed.slice(2));
      return;
    }
    flushList();
    nodes.push(
      <p key={`p-${nodes.length}`}>
        <Inline text={trimmed} />
      </p>
    );
  });
  flushList();

  return nodes;
}
