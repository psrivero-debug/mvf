import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileText, Image, Merge, Download, Loader2,
  CheckCircle2, Wand2, FileImage, FilePlus
} from "lucide-react";

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

  const descargar = () => {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "documento_extraido.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

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
              <Download className="w-4 h-4" /> Descargar como .txt
            </Button>
          </div>
        )}

        {done && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Texto extraído correctamente</p>}
      </CardContent>
    </Card>
  );
}

// ─── Tool: Fusionar Documentos ───────────────────────────────────────────────
function FusionarDocumentos() {
  const [files, setFiles] = useState([]);
  const [fileUrls, setFileUrls] = useState([]);
  const [instruccion, setInstruccion] = useState("");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const handleFiles = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setUploading(true);
    setResultado("");
    setDone(false);
    try {
      const uploads = await Promise.all(selected.map(f => base44.integrations.Core.UploadFile({ file: f })));
      setFiles(prev => [...prev, ...selected]);
      setFileUrls(prev => [...prev, ...uploads.map(u => u.file_url)]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const procesar = async () => {
    if (fileUrls.length < 1) return;
    setLoading(true);
    setDone(false);
    try {
      const prompt = `Tenés ${fileUrls.length} documento(s) adjunto(s). Tu tarea es: ${instruccion || "unificar y consolidar todos los documentos en uno solo, manteniendo la coherencia y el orden lógico del contenido. Eliminá repeticiones y organizá el texto de manera clara y profesional."} Devolvé el documento unificado completo, listo para usar.`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: fileUrls,
        model: "claude_sonnet_4_6",
      });
      setResultado(res);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const descargar = () => {
    const blob = new Blob([resultado], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "documento_unificado.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const quitar = (i) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setFileUrls(prev => prev.filter((_, idx) => idx !== i));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Merge className="w-5 h-5 text-accent" />
          Fusionar Documentos con IA
        </CardTitle>
        <CardDescription>Cargá varios documentos y la IA los unifica en uno solo coherente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <FilePlus className="w-8 h-8" />
            <p className="text-sm">{uploading ? "Subiendo archivos..." : "Hacé clic para agregar documentos (PDF, DOCX, TXT, imágenes)"}</p>
          </div>
          <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx,image/*" multiple className="hidden" onChange={handleFiles} />
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <Badge key={i} variant="secondary" className="gap-1 cursor-pointer" onClick={() => quitar(i)}>
                <FileText className="w-3 h-3" /> {f.name} ×
              </Badge>
            ))}
          </div>
        )}

        <div>
          <label className="text-sm font-medium block mb-1">Instrucción para la IA (opcional)</label>
          <Textarea
            placeholder="Ej: Unificá estos contratos eliminando cláusulas duplicadas y ordenando por fecha..."
            value={instruccion}
            onChange={e => setInstruccion(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={procesar} disabled={loading || fileUrls.length < 1} className="w-full gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando con IA...</> : <><Wand2 className="w-4 h-4" /> Fusionar documentos</>}
        </Button>

        {loading && <p className="text-xs text-muted-foreground text-center">Usando modelo avanzado — puede demorar unos segundos...</p>}

        {resultado && (
          <div className="space-y-2">
            <Textarea value={resultado} onChange={e => setResultado(e.target.value)} rows={10} className="font-mono text-sm" />
            <Button variant="outline" onClick={descargar} className="w-full gap-2">
              <Download className="w-4 h-4" /> Descargar documento unificado
            </Button>
          </div>
        )}

        {done && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Documentos fusionados correctamente</p>}
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

  const descargar = () => {
    const blob = new Blob([`ANÁLISIS DEL DOCUMENTO: ${file?.name}\n\n${resultado}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verificacion_${file?.name || "documento"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
              <Download className="w-4 h-4" /> Descargar análisis
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