import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileText, Image, Merge, Download, Loader2,
  CheckCircle2, Wand2, FileImage, FilePlus, X
} from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

// ─── Tool: Imagen a Word ─────────────────────────────────────────────────────
function ImagenAWord() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
    setResult("");
    setDone(false);
  };

  const procesar = async () => {
    if (!image) return;
    setLoading(true);
    setDone(false);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: image });
      const texto = await base44.integrations.Core.InvokeLLM({
        prompt: `Extraé y transcribí con exactitud todo el texto que aparece en esta imagen. Mantené el formato original lo más posible (títulos, párrafos, listas). Devolvé solo el texto, sin comentarios adicionales.`,
        file_urls: [file_url],
      });
      setResult(texto);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const descargar = () => descargarDocx(result, "documento_extraido");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileImage className="w-5 h-5 text-accent" />
          Imagen / Foto → Texto (Word)
        </CardTitle>
        <CardDescription>Subí una imagen o foto de un documento y extraemos el texto para descargar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="preview" className="max-h-48 mx-auto rounded-md object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Image className="w-10 h-10" />
              <p className="text-sm">Hacé clic para seleccionar imagen (JPG, PNG, WEBP, PDF)</p>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
        </div>

        {image && (
          <Button onClick={procesar} disabled={loading} className="w-full gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Extrayendo texto...</> : <><Wand2 className="w-4 h-4" /> Extraer texto con IA</>}
          </Button>
        )}

        {result && (
          <div className="space-y-2">
            <Textarea value={result} onChange={e => setResult(e.target.value)} rows={8} className="font-mono text-sm" />
            <Button variant="outline" onClick={descargar} className="w-full gap-2">
              <Download className="w-4 h-4" /> Descargar como Word (.docx)
            </Button>
          </div>
        )}

        {done && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Texto extraído correctamente</p>}
      </CardContent>
    </Card>
  );
}

// ─── Helper: Word con imágenes incrustadas ───────────────────────────────────
async function descargarDocxConImagenes(imagenes, docs, textosEmbebidos, instruccion) {
  const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } = await import("docx");

  const children = [];

  if (instruccion) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: instruccion, bold: true })] }));
    children.push(new Paragraph({}));
  }

  // Insertar cada imagen
  for (const img of imagenes) {
    children.push(new Paragraph({ children: [new TextRun({ text: img.name, bold: true, size: 20 })] }));
    // Fetch image as ArrayBuffer
    const response = await fetch(img.url);
    const buffer = await response.arrayBuffer();
    const ext = img.name.split(".").pop().toLowerCase();
    const type = ext === "png" ? "png" : ext === "gif" ? "gif" : "jpg";
    children.push(new Paragraph({
      children: [new ImageRun({ data: buffer, transformation: { width: 500, height: 350 }, type })]
    }));
    children.push(new Paragraph({}));
  }

  // Texto de documentos y bloques de texto
  if (textosEmbebidos) {
    textosEmbebidos.split("\n").forEach(linea => {
      children.push(new Paragraph({ children: [new TextRun({ text: linea, size: 22 })] }));
    });
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "documento_con_imagenes.docx";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Helper: generar y descargar .docx ──────────────────────────────────────
async function descargarDocx(texto, nombre = "documento_unificado") {
  const lineas = texto.split("\n");
  const parrafos = lineas.map(linea => {
    const esTitle = linea.startsWith("# ");
    const esH2 = linea.startsWith("## ");
    const texto2 = linea.replace(/^#{1,3}\s*/, "").trim();
    if (!texto2) return new Paragraph({});
    if (esTitle) return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: texto2, bold: true, size: 28 })] });
    if (esH2) return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: texto2, bold: true, size: 24 })] });
    return new Paragraph({ children: [new TextRun({ text: texto2, size: 22 })] });
  });

  const doc = new Document({ sections: [{ properties: {}, children: parrafos }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Tool: Fusionar / Combinar Imágenes + Texto → Word ──────────────────────
function FusionarDocumentos() {
  const [items, setItems] = useState([]); // { type: 'file'|'text', file?, name?, url?, text?, modoImagen? }
  const [textoLibre, setTextoLibre] = useState("");
  const [instruccion, setInstruccion] = useState("");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef();
  // "texto" = IA extrae el texto | "imagen" = se incrusta la imagen en el Word
  const [modoImagenes, setModoImagenes] = useState("texto");

  const handleFiles = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setUploading(true);
    try {
      const uploads = await Promise.all(selected.map(f => base44.integrations.Core.UploadFile({ file: f })));
      const nuevos = selected.map((f, i) => ({
        type: "file",
        name: f.name,
        url: uploads[i].file_url,
        isImage: f.type.startsWith("image/"),
        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      }));
      setItems(prev => [...prev, ...nuevos]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const agregarTexto = () => {
    if (!textoLibre.trim()) return;
    setItems(prev => [...prev, { type: "text", text: textoLibre.trim(), name: `Texto ${prev.filter(i => i.type === "text").length + 1}` }]);
    setTextoLibre("");
  };

  const quitar = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const procesar = async () => {
    if (items.length < 1) return;
    setLoading(true);
    setDone(false);
    try {
      const imagenes = items.filter(i => i.type === "file" && i.isImage);
      const docs = items.filter(i => i.type === "file" && !i.isImage);
      const textosEmbebidos = items.filter(i => i.type === "text").map((i, idx) => `--- Bloque de texto ${idx + 1} ---\n${i.text}`).join("\n\n");

      if (modoImagenes === "imagen") {
        // Modo: incrustar imágenes en el Word con el texto adicional abajo
        await descargarDocxConImagenes(imagenes, docs, textosEmbebidos, instruccion);
        setResultado("✅ Documento Word generado con las imágenes incrustadas.");
        setDone(true);
        setLoading(false);
        return;
      }

      // Modo: convertir imágenes a texto y unificar todo
      const fileUrls = items.filter(i => i.type === "file").map(i => i.url);
      const prompt = `Tenés ${fileUrls.length} archivo(s) adjunto(s)${textosEmbebidos ? " y los siguientes bloques de texto adicional:\n\n" + textosEmbebidos : ""}.\n\nTu tarea es: ${instruccion || "extraé todo el contenido de las imágenes y documentos, luego unificá TODO en un único documento coherente, bien ordenado y sin repeticiones. Si hay imágenes, transcribí su texto. Organizá el resultado de manera profesional con títulos claros."}\n\nDevolvé el documento unificado completo usando # para títulos principales y ## para subtítulos.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: fileUrls.length > 0 ? fileUrls : undefined,
        model: "claude_sonnet_4_6",
      });
      setResultado(res);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Merge className="w-5 h-5 text-accent" />
          Combinar Fotos + Texto → Word
        </CardTitle>
        <CardDescription>Agregá fotos, documentos y bloques de texto. La IA los unifica y podés descargar el resultado como Word (.docx).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Zona de carga de archivos */}
        <div
          className="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <FilePlus className="w-8 h-8" />
            <p className="text-sm font-medium">{uploading ? "Subiendo archivos..." : "Cargá fotos o documentos"}</p>
            <p className="text-xs">JPG, PNG, PDF, TXT, DOCX — podés seleccionar varios a la vez</p>
          </div>
          <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx,image/*" multiple className="hidden" onChange={handleFiles} />
        </div>

        {/* Agregar texto libre */}
        <div className="space-y-2">
          <label className="text-sm font-medium block">Agregar bloque de texto manual</label>
          <Textarea
            placeholder="Escribí o pegá texto aquí para incluirlo en el documento..."
            value={textoLibre}
            onChange={e => setTextoLibre(e.target.value)}
            rows={3}
          />
          <Button variant="outline" size="sm" onClick={agregarTexto} disabled={!textoLibre.trim()} className="gap-2">
            <FilePlus className="w-4 h-4" /> Agregar texto
          </Button>
        </div>

        {/* Lista de items cargados */}
        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contenido a fusionar ({items.length})</p>
            <div className="flex flex-wrap gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-secondary rounded-lg px-2 py-1 text-sm">
                  {item.isImage && item.preview
                    ? <img src={item.preview} className="w-6 h-6 rounded object-cover" alt="" />
                    : item.type === "text"
                      ? <FileText className="w-4 h-4 text-accent shrink-0" />
                      : <FileText className="w-4 h-4 shrink-0" />
                  }
                  <span className="max-w-[120px] truncate">{item.name}</span>
                  <button onClick={() => quitar(i)} className="text-muted-foreground hover:text-destructive ml-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modo imágenes */}
        {items.some(i => i.isImage) && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium block">¿Cómo incluir las imágenes?</label>
            <div className="flex gap-2">
              <button
                onClick={() => setModoImagenes("imagen")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${modoImagenes === "imagen" ? "border-accent bg-accent/10 text-accent-foreground" : "border-border text-muted-foreground hover:bg-muted/40"}`}
              >
                🖼️ Insertar imágenes en el Word
              </button>
              <button
                onClick={() => setModoImagenes("texto")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${modoImagenes === "texto" ? "border-accent bg-accent/10 text-accent-foreground" : "border-border text-muted-foreground hover:bg-muted/40"}`}
              >
                📝 Convertir imágenes a texto
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {modoImagenes === "imagen" ? "Las fotos se incrustarán una debajo de la otra en el documento." : "La IA extrae el texto de cada imagen y lo unifica en el documento."}
            </p>
          </div>
        )}

        {/* Instrucción IA */}
        <div>
          <label className="text-sm font-medium block mb-1">Instrucción para la IA {modoImagenes === "imagen" ? "(título del documento, opcional)" : "(opcional)"}</label>
          <Textarea
            placeholder="Ej: Unificá el contrato de la foto con el texto adicional, respetando el orden cronológico..."
            value={instruccion}
            onChange={e => setInstruccion(e.target.value)}
            rows={2}
          />
        </div>

        <Button onClick={procesar} disabled={loading || items.length < 1} className="w-full gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando con IA...</> : <><Wand2 className="w-4 h-4" /> Unificar todo</>}
        </Button>

        {loading && <p className="text-xs text-muted-foreground text-center">Procesando con modelo avanzado, puede demorar unos segundos...</p>}

        {resultado && (
          <div className="space-y-2">
            <Textarea value={resultado} onChange={e => setResultado(e.target.value)} rows={10} className="font-mono text-sm" />
            <Button onClick={() => descargarDocx(resultado)} className="w-full gap-2">
              <Download className="w-4 h-4" /> Descargar como Word (.docx)
            </Button>
          </div>
        )}

        {done && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Documento generado correctamente</p>}
      </CardContent>
    </Card>
  );
}

// ─── Tool: Verificar Documento ───────────────────────────────────────────────
function VerificarDocumento() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [instruccion, setInstruccion] = useState("");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResultado("");
    setDone(false);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
    setFileUrl(file_url);
    e.target.value = "";
  };

  const verificar = async () => {
    if (!fileUrl) return;
    setLoading(true);
    setDone(false);
    try {
      const prompt = instruccion
        ? `Analizá este documento y ${instruccion}. Sé preciso y detallado en tu análisis.`
        : `Analizá este documento jurídico/legal con criterio profesional. Identificá: 1) Tipo de documento y partes involucradas. 2) Observaciones y puntos relevantes. 3) Posibles errores, omisiones o cláusulas problemáticas. 4) Recomendaciones. Sé preciso y usa lenguaje jurídico argentino.`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [fileUrl],
        model: "claude_sonnet_4_6",
      });
      setResultado(res);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const descargar = () => descargarDocx(`# ANÁLISIS DEL DOCUMENTO: ${file?.name}\n\n${resultado}`, `verificacion_${file?.name || "documento"}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="w-5 h-5 text-accent" />
          Verificar / Analizar Documento
        </CardTitle>
        <CardDescription>Cargá un documento, indicá qué verificar y descargá el análisis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2 text-foreground font-medium">
              <FileText className="w-5 h-5 text-accent" /> {file.name}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="w-8 h-8" />
              <p className="text-sm">Hacé clic para cargar el documento a verificar</p>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx,image/*" className="hidden" onChange={handleFile} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">¿Qué querés verificar? (opcional)</label>
          <Textarea
            placeholder="Ej: Verificá que el contrato cumpla con la Ley 26.994, revisá las cláusulas de rescisión..."
            value={instruccion}
            onChange={e => setInstruccion(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={verificar} disabled={loading || !fileUrl} className="w-full gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</> : <><CheckCircle2 className="w-4 h-4" /> Verificar con IA</>}
        </Button>

        {loading && <p className="text-xs text-muted-foreground text-center">Analizando con modelo avanzado...</p>}

        {resultado && (
          <div className="space-y-2">
            <Textarea value={resultado} onChange={e => setResultado(e.target.value)} rows={10} className="text-sm" />
            <Button variant="outline" onClick={descargar} className="w-full gap-2">
              <Download className="w-4 h-4" /> Descargar análisis (.docx)
            </Button>
          </div>
        )}

        {done && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verificación completada</p>}
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function HerramientasEspeciales() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Herramientas Especiales</h1>
        <p className="text-muted-foreground text-sm mt-1">Procesamiento avanzado de documentos asistido por IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImagenAWord />
        <VerificarDocumento />
      </div>

      <FusionarDocumentos />
    </div>
  );
}