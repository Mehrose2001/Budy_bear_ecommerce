"use client";

import { useEffect, useRef } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";
import { sanitizeHtml } from "@/lib/legalHtml";
import { cn } from "@/lib/utils";

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];
const FONT_FACES = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Trebuchet MS",
];

function ToolbarButton({ label, active, onClick, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-primary hover:bg-brand-cream",
        active && "bg-brand-cream"
      )}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ id, value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = value || "<p></p>";
    if (editor.innerHTML !== next) {
      editor.innerHTML = next;
    }
  }, [value]);

  const emit = () => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(sanitizeHtml(editor.innerHTML));
  };

  const run = (command, extra) => {
    editorRef.current?.focus();
    document.execCommand(command, false, extra);
    emit();
  };

  const applyFontSize = (px) => {
    editorRef.current?.focus();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("fontSize", false, "7");
    const editor = editorRef.current;
    if (!editor) return;
    editor.querySelectorAll("font").forEach((font) => {
      if (font.getAttribute("size") !== "7") return;
      const span = document.createElement("span");
      span.style.fontSize = `${px}px`;
      span.innerHTML = font.innerHTML;
      font.replaceWith(span);
    });
    editor.querySelectorAll("span").forEach((span) => {
      const size = span.style.fontSize;
      if (size === "xxx-large" || size === "xx-large" || size === "-webkit-xxx-large") {
        span.style.fontSize = `${px}px`;
      }
    });
    emit();
  };

  const addLink = () => {
    const url = window.prompt("Link URL", "https://");
    if (!url) return;
    run("createLink", url);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-brand-cream/60 p-2">
        <select
          aria-label="Font"
          className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-xs"
          defaultValue="Arial"
          onChange={(event) => run("fontName", event.target.value)}
        >
          {FONT_FACES.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
        <select
          aria-label="Font size"
          className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-xs"
          defaultValue="16"
          onChange={(event) => applyFontSize(event.target.value)}
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} px
            </option>
          ))}
        </select>
        <select
          aria-label="Paragraph style"
          className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-xs"
          defaultValue="p"
          onChange={(event) => run("formatBlock", event.target.value)}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <ToolbarButton label="Bold" onClick={() => run("bold")}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => run("italic")}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => run("underline")}>
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <label className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-neutral-600">
          Color
          <input
            type="color"
            defaultValue="#16324f"
            className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
            onChange={(event) => run("foreColor", event.target.value)}
          />
        </label>
        <ToolbarButton label="Align left" onClick={() => run("justifyLeft")}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Align center" onClick={() => run("justifyCenter")}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Align right" onClick={() => run("justifyRight")}>
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Bullet list" onClick={() => run("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => run("insertOrderedList")}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Insert link" onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <div
        id={id}
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        className="min-h-72 px-4 py-3 text-sm leading-7 text-neutral-800 outline-none [&_h1]:text-2xl [&_h1]:font-black [&_h2]:text-lg [&_h2]:font-black [&_h3]:text-base [&_h3]:font-bold"
        onInput={emit}
        onBlur={emit}
      />
    </div>
  );
}
