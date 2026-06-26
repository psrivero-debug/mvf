import { PDFDocument } from "pdf-lib";

// 45 MB — margen seguro bajo el límite de 50 MB de UploadFile
const MAX_FILE_SIZE = 45 * 1024 * 1024;

/**
 * Comprime una imagen redimensionándola y re-comprimiéndola como JPEG.
 * Si el resultado no es más chico, devuelve el archivo original.
 */
export async function compressImage(file, maxDimension = 2000, quality = 0.8) {
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
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
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const nombreBase = file.name.replace(/\.[^/.]+$/, "");
          resolve(new File([blob], `${nombreBase}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
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