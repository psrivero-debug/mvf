import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";

export default function PuntosCaso({ caso, documentos, analisis }) {
  const [puntos, setPuntos] = useState(null);
  const [loading, setLoading] = useState(false);

  const generarPuntos = async () => {
    setLoading(true);
    const forceFresh = !!puntos; // "Regenerar" pide un análisis nuevo, no el guardado

    // Resolver textos de análisis previos
    const analisisConTexto = await Promise.all(
      (analisis || []).map(async (a) => {
        let texto = a.respuesta || "";
        if (texto.startsWith("http://") || texto.startsWith("https://")) {
          try { texto = await fetch(texto).then(r => r.text()); } catch {}
        }
        return `[${a.agente}] ${a.consulta}:\n${texto.slice(0, 800)}`;
      })
    );

    const docsTexto = (documentos || []).length > 0
      ? (documentos || []).map(d => `- ${d.titulo}${d.contenido_texto ? `: ${d.contenido_texto.slice(0, 300)}` : ""}`).join("\n")
      : "(Sin documentos)";

    const analisisTexto = analisisConTexto.length > 0
      ? analisisConTexto.join("\n\n---\n\n")
      : "(Sin análisis previos)";

    const resultado = await base44.integrations.Core.InvokeLLM({
      forceFresh,
      prompt: `Analizá el siguiente caso judicial de la Provincia de San Luis y listá sus puntos fuertes y puntos débiles desde una perspectiva jurídica objetiva.

CASO: ${caso.titulo}
Cliente: ${caso.client_name || "—"}
Tipo: ${caso.tipo_caso || "—"}
Partes: ${caso.partes || "—"}
Hechos: ${caso.hechos_resumen || caso.descripcion || "—"}

DOCUMENTOS:
${docsTexto}

ANÁLISIS PREVIOS DE AGENTES IA:
${analisisTexto}

Respondé en formato JSON con esta estructura exacta:
{
  "fuertes": ["punto fuerte 1", "punto fuerte 2", ...],
  "debiles": ["punto débil 1", "punto débil 2", ...]
}

Listá entre 3 y 6 puntos en cada categoría. Sé conciso, claro y técnico-jurídico.`,
      response_json_schema: {
        type: "object",
        properties: {
          fuertes: { type: "array", items: { type: "string" } },
          debiles: { type: "array", items: { type: "string" } },
        },
      },
      model: "claude_sonnet_4_6",
    });

    setPuntos(resultado);
    setLoading(false);
  };

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          Puntos fuertes y débiles del caso
        </h2>
        <Button
          size="sm"
          variant={puntos ? "outline" : "default"}
          onClick={generarPuntos}
          disabled={loading}
          className="gap-2 text-xs"
        >
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analizando...</>
            : puntos
              ? <><RefreshCw className="w-3.5 h-3.5" /> Regenerar</>
              : <><Sparkles className="w-3.5 h-3.5" /> Analizar con IA</>
          }
        </Button>
      </div>

      {!puntos && !loading && (
        <p className="text-xs text-muted-foreground">
          Generá un análisis rápido de fortalezas y debilidades del caso basado en los documentos y análisis disponibles.
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando análisis jurídico...
        </div>
      )}

      {puntos && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Puntos fuertes */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5" /> Puntos fuertes
            </p>
            <ul className="space-y-1.5">
              {(puntos.fuertes || []).map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <span className="text-green-600 font-bold mt-0.5 shrink-0">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Puntos débiles */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
              <ThumbsDown className="w-3.5 h-3.5" /> Puntos débiles
            </p>
            <ul className="space-y-1.5">
              {(puntos.debiles || []).map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <span className="text-red-500 font-bold mt-0.5 shrink-0">✗</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}