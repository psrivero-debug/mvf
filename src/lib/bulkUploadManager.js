import { base44 } from "@/api/base44Client";
import { prepareFileForUpload } from "@/lib/fileProcessing";
import { invokeLLM } from "@/lib/llm";
import { queryClientInstance } from "@/lib/query-client";
import { toast } from "@/components/ui/use-toast";
import { subirArchivoPrivado, urlFirmada, subirTextoLargo } from "@/lib/privateFiles";

export const PROMPT_TRANSCRIPCION = `Sos un transcriptor experto en documentos jurídicos argentinos escaneados.
Tu tarea es transcribir el contenido de esta imagen con la máxima fidelidad posible.

INSTRUCCIONES ESTRICTAS:
- Transcribí CADA PALABRA visible, incluyendo encabezados, sellos, firmas (indicalas como "[FIRMA]"), foliatura, numeraciones y fechas.
- Mantené la estructura original: párrafos, sangrías, listas numeradas, bullet points.
- Si hay texto manuscrito, transcribilo entre [MANUSCRITO: ...].
- Si hay sellos o membretes, transcribilos entre [SELLO: ...].
- Respetá mayúsculas, puntuación y acentos tal como aparecen.
- NO resumas, NO omitas nada. Transcribí TODO el texto visible de principio a fin.
- Al final, en una línea separada, escribí: TÍTULO SUGERIDO: [un título descriptivo conciso del documento, máximo 8 palabras].

Devolvé ÚNICAMENTE la transcripción completa (con el título sugerido al final), sin comentarios ni aclaraciones previas.`;

let state = {
  uploading: false,
  bulkProgress: { current: 0, total: 0, step: "" },
  conversionProgress: null,
  casoId: null,
};

const subscribers = new Set();

function setState(patch) {
  state = { ...state, ...patch };
  subscribers.forEach((cb) => cb(state));
}

export function subscribeBulkUpload(cb) {
  subscribers.add(cb);
  cb(state);
  return () => subscribers.delete(cb);
}

export function getBulkUploadState() {
  return state;
}

export async function startBulkUpload(files, casoId) {
  if (state.uploading) {
    toast({ title: "Ya hay una carga en curso", description: "Esperá a que termine la carga actual.", variant: "default" });
    return;
  }

  setState({
    uploading: true,
    casoId,
    bulkProgress: { current: 0, total: files.length, step: "Preparando archivos..." },
    conversionProgress: null,
  });

  try {
    // 1. Preparar (comprimir/dividir) todos los archivos
    const prepared = [];
    for (let fi = 0; fi < files.length; fi++) {
      setState({ bulkProgress: { current: fi, total: files.length, step: `Preparando ${files[fi].name}...` } });
      const parts = await prepareFileForUpload(files[fi], (current, total) =>
        setState({ conversionProgress: { current, total, name: files[fi].name } })
      );
      prepared.push({ original: files[fi], parts });
      setState({ conversionProgress: null });
    }
    const totalParts = prepared.reduce((acc, p) => acc + p.parts.length, 0);
    setState({ bulkProgress: { current: 0, total: totalParts, step: "Iniciando subida..." } });

    // 2. Subir y transcribir cada parte
    let done = 0;
    let errores = 0;
    for (const { original, parts } of prepared) {
      const nombreBase = original.name.replace(/\.[^/.]+$/, "");
      const tipo = original.type.includes("image") ? "imagen" : original.type.includes("pdf") ? "pdf" : "otro";

      for (let p = 0; p < parts.length; p++) {
        done++;
        const sufijo = parts.length > 1 ? ` (parte ${p + 1}/${parts.length})` : "";

        try {
          // Subir archivo
          setState({ bulkProgress: { current: done, total: totalParts, step: `Subiendo ${original.name}${sufijo}...` } });
          const file_uri = await subirArchivoPrivado(parts[p]);

          // Transcribir con IA (gemini_3_flash: rápido y soporta visión)
          setState({ bulkProgress: { current: done, total: totalParts, step: `Transcribiendo ${original.name}${sufijo}...` } });
          let contenido_texto = "";
          let titulo = parts.length > 1 ? `${nombreBase} - Parte ${p + 1}` : nombreBase;
          try {
            const urlFirm = await urlFirmada(file_uri);
            const resultado = await invokeLLM({
              prompt: PROMPT_TRANSCRIPCION,
              file_urls: [urlFirm],
              model: "gemini_3_flash",
            });
            const lines = String(resultado).split("\n");
            const tituloLine = lines.findLast((l) => l.trim().startsWith("TÍTULO SUGERIDO:"));
            if (tituloLine) {
              const t = tituloLine.replace("TÍTULO SUGERIDO:", "").trim();
              if (t) titulo = parts.length > 1 ? `${t} - Parte ${p + 1}` : t;
              contenido_texto = lines.filter((l) => !l.trim().startsWith("TÍTULO SUGERIDO:")).join("\n").trim();
            } else {
              contenido_texto = resultado;
            }
          } catch {
            contenido_texto = "";
          }

          // Subir texto si es muy largo
          contenido_texto = await subirTextoLargo(contenido_texto, `doc_${Date.now()}`);

          // Guardar documento
          await base44.entities.CasoDocumento.create({
            caso_id: casoId,
            titulo,
            tipo_documento: tipo,
            file_url: file_uri,
            contenido_texto,
            fuente: "",
            fecha_documento: "",
            notas: parts.length > 1 ? `Parte ${p + 1} de ${parts.length} (división automática)` : "",
            orden: done - 1,
          });
        } catch (err) {
          errores++;
          // Un archivo falla pero el lote continúa con el siguiente
        }
      }
    }

    queryClientInstance.invalidateQueries({ queryKey: ["caso_documentos", casoId] });
    toast({ title: "Carga masiva completada", description: `Se procesaron ${totalParts} archivo(s)${errores > 0 ? ` (${errores} con error)` : ""}.`, variant: "default" });
  } catch (err) {
    toast({ title: "Error al subir documentos", description: err?.message || "Intentá nuevamente.", variant: "destructive" });
  } finally {
    setState({
      uploading: false,
      bulkProgress: { current: 0, total: 0, step: "" },
      conversionProgress: null,
      casoId: null,
    });
  }
}