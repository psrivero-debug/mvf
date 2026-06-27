import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

// Usar CDN para el worker: evita problemas de import/bundle del worker ESM en Vite.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// 9 MB — bajo el límite de 10 MB de procesamiento de InvokeLLM (y también del de 50 MB de UploadFile).
// Así cada parte dividida/comprimida puede transcribirse con IA sin rechazo.
const MAX_FILE_SIZE = 9 * 1024 * 1024;

/**
 * Convierte un PDF a blanco y negro (escala de grises) rasterizando cada página
 * como JPEG comprimido y reensamblando un nuevo PDF. Reduce drásticamente el
 * tamaño de PDFs escaneados a color, permitiendo cargarlos para análisis con IA.
 * Devuelve un nuevo File .pdf. Si falla, lanza para que el llamador haga fallback.
 */
export async function convertPdfToGrayscale(file, onProgress) {
  // Probar progresivamente con menor escala y calidad hasta quedar bajo el límite.
  const intentos = [
    { scale: 1.5, quality: 0.6 },
    { scale: 1.2, quality: 0.45 },
    { scale: 1.0, quality: 0.35 },
  ];
  let ultimoResultado = null;
  for (const { scale, quality } of intentos) {
    try {
      const resultado = await _convertPdfToGrayscale(file, scale, quality, onProgress);
      if (resultado.size <= MAX_FILE_SIZE) return resultado;
      ultimoResultado = resultado; // seguir probando con menor calidad
    } catch (e) {
      // si falla un intento, probar el siguiente
    }
  }
  if (ultimoResultado) return ultimoResultado; // al menos algo más chico
  throw new Error("No se pudo reducir el PDF");
}

async function _convertPdfToGrayscale(file, scale, quality, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const newPdf = await PDFDocument.create();
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convertir a escala de grises (luminancia)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    for (let j = 0; j < d.length; j += 4) {
      const gray = d[j] * 0.299 + d[j + 1] * 0.587 + d[j + 2] * 0.114;
      d[j] = d[j + 1] = d[j + 2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);

    const jpegBlob = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", quality)
    );
    const jpgBytes = await jpegBlob.arrayBuffer();
    const img = await newPdf.embedJpg(jpgBytes);
    const newPage = newPdf.addPage([img.width, img.height]);
    newPage.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });

    if (onProgress) onProgress(i, numPages);
  }

  const pdfBytes = await newPdf.save();
  const nombreBase = file.name.replace(/\.pdf$/i, "");
  return new File([pdfBytes], `${nombreBase}_byn.pdf`, { type: "application/pdf" });
}

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
export async function prepareFileForUpload(file, onProgress) {
  if (file.type === "application/pdf") {
    // 1. Dividir primero (no necesita worker, es rápido con pdf-lib)
    let parts = await splitPdf(file);
    // 2. Si alguna parte sigue superando el límite, convertirla a blanco y negro
    const resultado = [];
    for (const part of parts) {
      if (part.size > MAX_FILE_SIZE) {
        try {
          const convertido = await convertPdfToGrayscale(part, onProgress);
          // Volver a dividir si la conversión dejó la parte todavía grande
          const subPartes = await splitPdf(convertido);
          resultado.push(...subPartes);
        } catch (e) {
          // Si la conversión falla, igual subimos la parte (geminiLLM maneja hasta ~20 MB)
          resultado.push(part);
        }
      } else {
        resultado.push(part);
      }
    }
    return resultado;
  }
  if (file.type.startsWith("image/")) {
    return [await compressImage(file)];
  }
  return [file];
}