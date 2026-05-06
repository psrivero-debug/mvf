import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2, Sparkles, Copy, Printer, Trash2, AlertCircle, CheckCircle2, Scale } from "lucide-react";
import ReactMarkdown from "react-markdown";

const MODOS = [
  {
    id: "interpretacion",
    label: "Interpretación Jurídica",
    icon: Scale,
    color: "bg-blue-100 text-blue-700",
    descripcion: "Explicar en lenguaje claro qué pide o resuelve el documento",
    prompt: (texto) => `Sos un abogado experto en derecho argentino, especializado en la Provincia de San Luis.

Se te presenta un documento judicial o resolución emitida por un juez o tribunal. Tu tarea es:

1. **RESUMEN EJECUTIVO**: En 2-3 oraciones, explicar de qué se trata el documento en lenguaje simple y claro.
2. **¿QUÉ PIDE O RESUELVE?**: Explicar concretamente qué ordena, solicita o resuelve el juez/tribunal.
3. **¿A QUIÉN VA DIRIGIDO Y QUÉ DEBE HACER?**: Identificar a quién le exige algo y exactamente qué acción debe tomar.
4. **PLAZOS CRÍTICOS**: Listar todos los plazos mencionados con su fecha exacta o días hábiles.
5. **CONSECUENCIAS DEL INCUMPLIMIENTO**: Qué puede pasar si no se cumple lo ordenado.
6. **TÉRMINOS JURÍDICOS DIFÍCILES**: Explicar en lenguaje coloquial los términos técnicos usados.
7. **ACCIÓN INMEDIATA RECOMENDADA**: Qué debería hacer el abogado o el cliente como paso siguiente.

Usá lenguaje claro, directo y accesible. Evitá la jerga jurídica innecesaria. Si algo no queda claro en el documento, indicalo.

DOCUMENTO:
${texto}`,
  },
  {
    id: "transcripcion",
    label: "Transcripción y Limpieza",
    icon: FileText,
    color: "bg-green-100 text-green-700",
    descripcion: "Transcribir y ordenar el texto del documento escaneado",
    prompt: (texto) => `Sos un asistente especializado en documentos judiciales argentinos.

Tu tarea es transcribir y limpiar el siguiente texto de un documento judicial, corrigiendo errores de OCR, mejorando la puntuación y organizando el contenido de forma clara y legible.

Mantené el contenido original íntegro, solo mejorá la presentación y corregí errores evidentes de digitalización.

DOCUMENTO:
${texto}`,
  },
  {
    id: "resumen_cliente",
    label: "Resumen para Cliente",
    icon: CheckCircle2,
    color: "bg-purple-100 text-purple-700",
    descripcion: "Explicar el documento en lenguaje simple para el cliente",
    prompt: (texto) => `Sos un abogado que necesita explicarle a un cliente sin conocimientos jurídicos qué dice un documento judicial que recibió.

Explicá el documento de manera:
- **MUY SIMPLE y CLARA**, sin tecnicismos
- Con lenguaje cotidiano argentino
- Indicando exactamente qué tiene que hacer el cliente, si es que debe hacer algo
- Mencionando los plazos de manera comprensible (ej: "tenés 5 días hábiles, o sea hasta el próximo martes aproximadamente")
- Resaltando si hay alguna urgencia

Al final, agregá una sección "¿Qué hacemos ahora?" con los pasos concretos a seguir.

DOCUMENTO:
${texto}`,
  },
  {
    id: "analisis_fondo",
    label: "Análisis de Fondo",
    icon: Sparkles,
    color: "bg-orange-100 text-orange-700",
    descripcion: "Análisis jurídico profundo con jurisprudencia y estrategia",
    prompt: (texto) => `Sos un abogado experto en derecho argentino, Provincia de San Luis.

Realizá un análisis jurídico profundo de este documento judicial:

1. **NATURALEZA JURÍDICA**: Tipo de acto procesal, instancia, fuero.
2. **FUNDAMENTOS LEGALES CITADOS**: Artículos, leyes y jurisprudencia mencionada.
3. **ANÁLISIS CRÍTICO**: ¿Es correcto jurídicamente? ¿Hay errores o irregularidades?
4. **POSIBLES RECURSOS**: ¿Qué recursos procesales existen contra esta decisión?
5. **PLAZOS PROCESALES**: Plazos para recurrir o contestar.
6. **JURISPRUDENCIA APLICABLE**: Citar jurisprudencia relevante de CSJN y tribunales de San Luis.
7. **ESTRATEGIA RECOMENDADA**: Qué hacer, cómo responder, y por qué.

Sé preciso, técnico y completo.

DOCUMENTO:
${texto}`,
  },
];

export default function InterpretarDocumento() {
  const [archivo, setArchivo] = useState(null);
  const [textoExtraido, setTextoExtraido] = useState("");
  const [resultado, setResultado] = useState(null);
  const [modoSeleccionado, setModoSeleccionado] = useState("interpretacion");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [copiado, setCopiado] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setArchivo(file);
    setResultado(null);
    setTextoExtraido("");

    setLoading(true);
    setLoadingStep("Subiendo archivo...");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    setLoadingStep("Extrayendo texto del documento...");
    const extraction = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          texto_completo: { type: "string", description: "Todo el texto del documento, transcripto íntegramente" },
          tipo_documento: { type: "string", description: "Tipo de documento (sentencia, resolución, oficio, cédula, etc.)" },
          fecha: { type: "string", description: "Fecha del documento si se menciona" },
          juzgado: { type: "string", description: "Juzgado o tribunal que lo emite" },
        },
      },
    });

    const texto = extraction?.output?.texto_completo || "";
    setTextoExtraido(texto);
    setLoading(false);
    setLoadingStep("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleAnalizar = async () => {
    if (!textoExtraido.trim()) return;
    const modo = MODOS.find(m => m.id === modoSeleccionado);
    setLoading(true);
    setLoadingStep(`Analizando con Agente Jurídico: ${modo.label}...`);
    setResultado(null);

    const respuesta = await base44.integrations.Core.InvokeLLM({
      prompt: modo.prompt(textoExtraido),
      model: "claude_sonnet_4_6",
    });

    setResultado(respuesta);
    setLoading(false);
    setLoadingStep("");
  };

  const handleCopiar = () => {
    if (!resultado) return;
    navigator.clipboard.writeText(resultado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleImprimir = () => {
    if (!resultado) return;
    const modo = MODOS.find(m => m.id === modoSeleccionado);
    const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #222; padding: 40px; max-width: 900px; margin: 0 auto; }
      .header { border-bottom: 3px solid #1e3a5f; padding-bottom: 18px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-start; }
      .logo h1 { font-size: 20px; font-weight: bold; color: #1e3a5f; }
      .logo p { font-size: 11px; color: #666; margin-top: 3px; }
      .badge { background: #1e3a5f; color: white; padding: 8px 16px; border-radius: 6px; text-align: center; font-size: 12px; font-weight: bold; }
      .meta { font-size: 11px; color: #888; margin-bottom: 22px; }
      .content { font-size: 13px; line-height: 1.8; }
      .content h1, .content h2, .content h3 { color: #1e3a5f; margin: 18px 0 8px; }
      .content p { margin-bottom: 10px; }
      .content ul, .content ol { padding-left: 20px; margin-bottom: 10px; }
      .content li { margin-bottom: 4px; }
      .content strong { color: #1e3a5f; }
      .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 10px; color: #999; text-align: center; }
      @media print { body { padding: 20px; } }
    </style>
    </head><body>
    <div class="header">
      <div class="logo"><h1>Pérez &amp; Funes</h1><p>Estudio Jurídico · Negocios Inmobiliarios</p></div>
      <div class="badge">${modo.label.toUpperCase()}</div>
    </div>
    <div class="meta">Archivo: ${archivo?.name || "—"} &nbsp;·&nbsp; Fecha: ${hoy}</div>
    <div class="content">${resultado.replace(/\n/g, "<br>")}</div>
    <div class="footer">Pérez &amp; Funes — Estudio Jurídico · San Luis · Análisis generado con IA</div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  const resetear = () => {
    setArchivo(null);
    setTextoExtraido("");
    setResultado(null);
    setLoading(false);
    setLoadingStep("");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Interpretar Documento Judicial</h1>
          <p className="text-muted-foreground mt-1">
            Subí una resolución, oficio o cédula del juez y el Agente Jurídico la explica en lenguaje claro
          </p>
        </div>
        {archivo && (
          <Button variant="outline" size="sm" onClick={resetear} className="shrink-0 gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Nuevo documento
          </Button>
        )}
      </div>

      {/* Zona de carga */}
      {!archivo ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-12 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
          <Upload className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-base font-medium text-muted-foreground">Arrastrá o hacé clic para subir el documento</p>
          <p className="text-sm text-muted-foreground/60 mt-2">PDF, imágenes (JPG/PNG), Word o texto — resoluciones, oficios, cédulas, sentencias</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border">
          <FileText className="w-6 h-6 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{archivo.name}</p>
            <p className="text-xs text-muted-foreground">{(archivo.size / 1024).toFixed(0)} KB</p>
          </div>
          {textoExtraido && <Badge className="bg-green-100 text-green-700 shrink-0">✓ Texto extraído</Badge>}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
          <p className="text-sm text-primary font-medium">{loadingStep}</p>
        </div>
      )}

      {/* Texto extraído + modos de análisis */}
      {textoExtraido && !loading && (
        <div className="space-y-5">
          {/* Texto crudo plegable */}
          <details className="border rounded-xl overflow-hidden">
            <summary className="px-4 py-3 bg-muted/30 cursor-pointer text-sm font-medium flex items-center gap-2 select-none">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Ver texto extraído del documento
            </summary>
            <div className="p-4 text-xs text-muted-foreground whitespace-pre-wrap max-h-56 overflow-y-auto bg-muted/10">
              {textoExtraido}
            </div>
          </details>

          {/* Selector de modo */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">¿Qué querés hacer con este documento?</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {MODOS.map(({ id, label, icon: Icon, color, descripcion }) => (
                <button
                  key={id}
                  onClick={() => { setModoSeleccionado(id); setResultado(null); }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    modoSeleccionado === id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{descripcion}</p>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleAnalizar} disabled={loading} className="gap-2 w-full sm:w-auto">
            <Sparkles className="w-4 h-4" />
            {MODOS.find(m => m.id === modoSeleccionado)?.label || "Analizar"}
          </Button>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{MODOS.find(m => m.id === modoSeleccionado)?.label}</span>
                <Badge className="bg-green-100 text-green-700 text-[10px]">Generado</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={handleCopiar}>
                  <Copy className="w-3.5 h-3.5" />
                  {copiado ? "¡Copiado!" : "Copiar"}
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={handleImprimir}>
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </Button>
              </div>
            </div>
            <div className="p-6 prose prose-sm max-w-none text-sm leading-relaxed">
              <ReactMarkdown>{resultado}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info box */}
      {!archivo && !loading && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">¿Para qué sirve esta herramienta?</p>
            <p>Los jueces y tribunales suelen emitir resoluciones con lenguaje técnico difícil de interpretar. Esta herramienta extrae el texto del documento y usa Inteligencia Artificial entrenada en derecho argentino para explicarlo claramente, identificar los plazos críticos y recomendar la acción a tomar.</p>
          </div>
        </div>
      )}
    </div>
  );
}