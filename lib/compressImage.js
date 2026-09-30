export async function compressImageFile(file, { maxWidth = 1600, quality = 0.82 } = {}) {
  if (!file || typeof window === "undefined") return file;
  if (!file.type || file.type.includes("svg") || file.type.includes("gif")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > maxWidth ? maxWidth / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    bitmap.close?.();
    if (!blob || blob.size >= file.size) return file;
    const nextName = String(file.name || "product").replace(/\.[^.]+$/, ".webp");
    return new File([blob], nextName, { type: "image/webp" });
  } catch {
    return file;
  }
}
