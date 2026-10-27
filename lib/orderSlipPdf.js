import { brand } from "@/data/brand";
import { buildOrderSlipHtml } from "@/lib/orderNotifications";

const RECEIPT_WIDTH_PX = 900;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

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

function mountReceiptFrame(html) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Order receipt");
  iframe.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${RECEIPT_WIDTH_PX}px`,
    "height:1200px",
    "border:0",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");
  document.body.appendChild(iframe);
  iframe.srcdoc = html;
  return iframe;
}

function waitForFrame(iframe) {
  return new Promise((resolve) => {
    let started = false;
    const finish = () => {
      if (started) return;
      const doc = iframe.contentDocument;
      if (!doc?.body?.querySelector(".sheet") || !doc.defaultView) return;
      started = true;
      const images = [...doc.images];
      if (!images.length) {
        resolve();
        return;
      }
      let pending = images.length;
      const done = () => {
        pending -= 1;
        if (pending <= 0) resolve();
      };
      images.forEach((img) => {
        if (img.complete) done();
        else {
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }
      });
    };

    iframe.addEventListener("load", finish);
    finish();
  });
}

function receiptPageSlices(doc, pageHeight) {
  const bodyTop = doc.body.getBoundingClientRect().top;
  const total = Math.max(Math.ceil(doc.body.scrollHeight), 1);
  const blocks = [...doc.querySelectorAll(".header, .parties, tr, .totals, .footer")]
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: Math.max(0, rect.top - bodyTop),
        bottom: Math.max(0, rect.bottom - bodyTop),
      };
    })
    .filter((block) => block.bottom > block.top)
    .sort((a, b) => a.top - b.top || a.bottom - b.bottom);

  const slices = [];
  let start = 0;
  while (start < total - 1) {
    let end = Math.min(start + pageHeight, total);
    if (end < total) {
      const crossing = blocks.find(
        (block) =>
          block.top > start + 24 &&
          block.top < end &&
          block.bottom > end + 1 &&
          block.bottom - block.top <= pageHeight
      );
      if (crossing) end = Math.floor(crossing.top);
      if (end <= start + 8) end = Math.min(start + pageHeight, total);
    }
    slices.push([start, end]);
    start = end;
  }
  return slices.length ? slices : [[0, total]];
}

async function buildOrderSlipPdf(html) {
  const html2canvasModule = await import("html2canvas");
  const html2canvas = html2canvasModule.default || html2canvasModule;
  const jspdfModule = await import("jspdf");
  const JsPDF = jspdfModule.jsPDF || jspdfModule.default;
  const iframe = mountReceiptFrame(html);
  try {
    await waitForFrame(iframe);
    const doc = iframe.contentDocument;
    const height = Math.max(Math.ceil(doc.body.scrollHeight), 1);
    iframe.style.height = `${height}px`;

    const canvas = await html2canvas(doc.body, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#f7efe4",
      width: RECEIPT_WIDTH_PX,
      height,
      windowWidth: RECEIPT_WIDTH_PX,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    });

    const pageHeightPx = (A4_HEIGHT_MM * RECEIPT_WIDTH_PX) / A4_WIDTH_MM;
    const slices = receiptPageSlices(doc, pageHeightPx);
    const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const scale = canvas.width / RECEIPT_WIDTH_PX;

    slices.forEach(([start, end], index) => {
      if (index > 0) pdf.addPage();
      pdf.setFillColor(247, 239, 228);
      pdf.rect(0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, "F");
      const sourceY = Math.round(start * scale);
      const sourceHeight = Math.max(1, Math.round((end - start) * scale));
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = Math.min(sourceHeight, canvas.height - sourceY);
      const context = slice.getContext("2d");
      context.fillStyle = "#f7efe4";
      context.fillRect(0, 0, slice.width, slice.height);
      context.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        slice.height,
        0,
        0,
        canvas.width,
        slice.height
      );
      const sliceHeightMm = (slice.height * A4_WIDTH_MM) / canvas.width;
      pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, A4_WIDTH_MM, sliceHeightMm);
    });

    return pdf.output("blob");
  } finally {
    iframe.remove();
  }
}

export async function downloadOrderSlip(order) {
  if (typeof window === "undefined" || !order) return;
  const logoSrc = await logoDataUrl();
  const blob = await buildOrderSlipPdf(buildOrderSlipHtml(order, logoSrc));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.id}-receipt.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
