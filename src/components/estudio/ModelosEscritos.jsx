import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Printer, Copy, ChevronDown, ChevronUp, Sparkles, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { GRUPOS_MODELOS, TODOS_MODELOS } from "./modelos-escritos-data";

const AGENTE_LABELS = {
  lector_juridico: "Lector Jurídico",
  abogado_defensor: "Abogado Defensor",
  analista: "Justua (Analista)",
  transcriptor: "Transcriptor / Redactor",
  cronologista: "Cronologista",
  extractor_keywords: "Extractor de Keywords",
};

export default function ModelosEscritos({ caso, documentos }) {
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [instrucciones, setInstrucciones] = useState("");
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [gruposAbiertos, setGruposAbiertos] = useState({ "Judiciales Provinciales": true });

  const toggleGrupo = (label) =>
    setGruposAbiertos(prev => ({ ...prev, [label]: !prev[label] }));

  const { data: analisis = [] } = useQuery({
    queryKey: ["caso_analisis", caso.id],
    queryFn: () => base44.entities.CasoAnalisis.filter({ caso_id: caso.id }, "-created_date"),
  });

  const generarEscrito = async () => {
    if (!modeloSeleccionado) return;
    setLoading(true);
    setResultado(null);

    const analisisConTexto = await Promise.all(
      analisis.map(async (a) => {
        let texto = a.respuesta || "";
        if (texto.startsWith("http://") || texto.startsWith("https://")) {
          try { texto = await fetch(texto).then(r => r.text()); } catch {}
        }
        return { ...a, textoResuelto: texto };
      })
    );

    const analisisTexto = analisisConTexto.length > 0
      ? "\n\n=== ANÁLISIS PREVIOS REALIZADOS POR AGENTES IA ===\n" +
        analisisConTexto.map(a =>
          `[${AGENTE_LABELS[a.agente] || a.agente}] Consulta: ${a.consulta}\n${a.textoResuelto.slice(0, 1500)}`
        ).join("\n\n---\n\n") +
        "\n=== FIN DE ANÁLISIS ==="
      : "";

    const docsTexto = documentos.length > 0
      ? "\n\nDOCUMENTOS DEL CASO:\n" +
        documentos.map(d => `- ${d.titulo}${d.contenido_texto ? `: ${d.contenido_texto.slice(0, 400)}...` : ""}`).join("\n")
      : "";

    const modelo = TODOS_MODELOS.find(m => m.id === modeloSeleccionado);
    const prompt = modelo.prompt(caso, instrucciones) + analisisTexto + docsTexto;

    const respuesta = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6",
    });

    setResultado(respuesta);
    setLoading(false);
    setExpandido(true);
  };

  const handleCopiar = () => {
    if (!resultado) return;
    navigator.clipboard.writeText(resultado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleImprimir = () => {
    if (!resultado) return;
    const modelo = TODOS_MODELOS.find(m => m.id === modeloSeleccionado);
    const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; }
        body { font-family: 'Arial', sans-serif; color: #222; background: #fff; }
        .page { max-width: 900px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; padding: 30px 40px; }
        .header-content { display: flex; align-items: center; gap: 15px; }
        .logo { width: 50px; height: 50px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #1e3a5f; font-size: 24px; }
        .header h1 { font-size: 22px; font-weight: bold; }
        .header p { font-size: 12px; opacity: 0.9; margin-top: 2px; }
        .meta { background: #f9f9f9; padding: 15px 40px; font-size: 12px; color: #666; border-bottom: 1px solid #ddd; display: flex; gap: 30px; }
        .content { padding: 40px; white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.8; color: #333; }
        .footer { padding: 20px 40px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; background: #f9f9f9; }
        @media print { body { margin: 0; } .page { max-width: 100%; } }
      </style>
    </head><body>
      <div class="page">
        <div class="header">
          <div class="header-content">
            <div class="logo">⚖️</div>
            <div>
              <h1>Pérez & Funes — Estudio Jurídico</h1>
              <p>${modelo?.label || "Escrito Judicial"} · ${caso.titulo}</p>
            </div>
          </div>
        </div>
        <div class="meta">
          <span><strong>Caso:</strong> ${caso.titulo}</span>
          <span><strong>Cliente:</strong> ${caso.client_name || "—"}</span>
          <span><strong>Fecha:</strong> ${hoy}</span>
        </div>
        <div class="content">${resultado}</div>
        <div class="footer">Documento generado por Sistema de Análisis · Estudio Jurídico Pérez & Funes · San Luis</div>
      </div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  const modeloActual = TODOS_MODELOS.find(m => m.id === modeloSeleccionado);

  return (
    <div className="space-y-6">
      {/* Selector agrupado con accordion */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Seleccioná el tipo de escrito
        </h3>
        {GRUPOS_MODELOS.map((grupo) => {
          const abierto = !!gruposAbiertos[grupo.label];
          const tieneSeleccion = grupo.modelos.some(m => m.id === modeloSeleccionado);
          return (
            <div key={grupo.label} className={`border rounded-xl overflow-hidden transition-all ${tieneSeleccion ? "border-primary/50" : "border-border"}`}>
              <button
                onClick={() => toggleGrupo(grupo.label)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${abierto ? "bg-muted/50" : "bg-background hover:bg-muted/30"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{grupo.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{grupo.modelos.length}</span>
                  {tieneSeleccion && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">seleccionado</span>}
                </div>
                {abierto ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {abierto && (
                <div className="p-3 border-t bg-background">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {grupo.modelos.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setModeloSeleccionado(m.id); setResultado(null); }}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          modeloSeleccionado === m.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 bg-background"
                        }`}
                      >
                        <Badge className={`${m.color} text-[10px] mb-1.5`} variant="secondary">{m.label}</Badge>
                        <p className="text-xs text-muted-foreground leading-tight">{m.descripcion}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Banner análisis disponibles */}
      {analisis.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Brain className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-primary">
            Se incorporarán automáticamente <strong>{analisis.length} análisis</strong> de los Agentes IA al generar el escrito.
          </p>
        </div>
      )}

      {/* Instrucciones adicionales */}
      {modeloSeleccionado && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
              Instrucciones adicionales (opcional)
            </label>
            <textarea
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              rows={3}
              placeholder="Ej: incluir reclamo por daños y perjuicios, destacar la urgencia, agregar excepción de prescripción..."
              value={instrucciones}
              onChange={e => setInstrucciones(e.target.value)}
            />
          </div>
          <Button onClick={generarEscrito} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Generando escrito..." : `Generar ${modeloActual?.label}`}
          </Button>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{modeloActual?.label}</span>
                <Badge className="bg-green-100 text-green-700 text-[10px]" variant="secondary">Generado</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={handleCopiar}>
                  <Copy className="w-3.5 h-3.5" />
                  {copiado ? "¡Copiado!" : "Copiar"}
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={handleImprimir}>
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </Button>
                <button onClick={() => setExpandido(!expandido)} className="text-muted-foreground hover:text-foreground">
                  {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {expandido && (
              <div className="p-5 prose prose-sm max-w-none text-sm leading-relaxed">
                <ReactMarkdown>{resultado}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!modeloSeleccionado && (
        <div className="text-center py-10 border-2 border-dashed rounded-xl">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Seleccioná un tipo de escrito para comenzar</p>
          <p className="text-xs text-muted-foreground/60 mt-1">La IA generará el modelo completo con los datos del caso</p>
        </div>
      )}
    </div>
  );
}