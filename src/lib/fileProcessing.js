import { PDFDocument } from "pdf-lib";

// 9 MB — bajo el límite de 10 MB de procesamiento de InvokeLLM (y también del de 50 MB de UploadFile).
// Así cada parte dividida/comprimida puede transcribirse con IA sin rechazo.
const MAX_FILE_SIZE = 9 * 1024 * 1024;

/**
 * Comprime una imagen redimensionándola y re-comprimiéndola como JPEG.
 * Si el resultado sigue superando MAX_FILE_SIZE, baja calidad y dimensiones
 * progresivamente hasta que entre. Si nunca mejora, devuelve el original.
 */
export async function compressImage(file, maxDimension = 2000, quality = 0.8) {
  if (!file.type.startsWith("image/")) return file;

  const doCompress = (dim, qual) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > dim || height > dim) {
        const ratio = Math.min(dim / width, dim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", qual);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });

  let dim = maxDimension;
  let qual = quality;
  let blob = await doCompress(dim, qual);

  // Bajar calidad y dimensiones hasta quedar bajo el límite (mínimo quality 0.3)
  while (blob && blob.size > MAX_FILE_SIZE && qual > 0.3) {
    qual = Math.max(0.3, qual - 0.15);
    dim = Math.round(dim * 0.8);
    blob = await doCompress(dim, qual);
  }

  if (!blob || blob.size >= file.size) return file;
  const nombreBase = file.name.replace(/\.[^/.]+$/, "");
  return new File([blob], `${nombreBase}.jpg`, { type: "image/jpeg" });
}

/**
 * Divide un PDF en partes de hasta ~45 MB.
 * Devuelve un array de Files (uno por parte). Si no excede el límite, devuelve [file].
 */
export async function splitPdf(file) {
  if (file.type !== "application/pdf" || file.size <= MAX_FILE_SIZE) {
    return [file];
  }

  const bytes = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = srcDoc.getPageCount();
  const nombreBase = file.name.replace(/\.pdf$/i, "");

  // Estimar bytes por página para calcular cuántas páginas entran por parte
  const bytesPerPage = file.size / total;
  const pagesPerPart = Math.max(1, Math.floor(MAX_FILE_SIZE / bytesPerPage));

  const parts = [];
  for (let start = 0; start < total; start += pagesPerPart) {
    const end = Math.min(start + pagesPerPart, total);
    const partDoc = await PDFDocument.create();
    const pageIndices = Array.from({ length: end - start }, (_, i) => start + i);
    const pages = await partDoc.copyPages(srcDoc, pageIndices);
    pages.forEach((p) => partDoc.addPage(p));
    const partBytes = await partDoc.save();
    parts.push(
      new File([partBytes], `${nombreBase}_parte${parts.length + 1}.pdf`, { type: "application/pdf" })
    );
  }
  return parts;
}

/**
 * Prepara un archivo para subida: comprime imágenes y divide PDFs grandes.
 * Devuelve siempre un array de Files listos para subir.
 */
export async function prepareFileForUpload(file) {
  if (file.type === "application/pdf") {
    return splitPdf(file);
  }
  if (file.type.startsWith("image/")) {
    return [await compressImage(file)];
  }
  return [file];
}