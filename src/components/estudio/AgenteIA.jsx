import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Bot, Send, Loader2, Scale, Shield, FileSearch, User, Trash2, Sparkles, CheckSquare, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Anotaciones from "./Anotaciones";

const agentes = [
  {
    id: "lector_juridico",
    label: "Lector Jurídico",
    icon: FileSearch,
    color: "bg-blue-100 text-blue-700",
    borderColor: "border-blue-400",
    descripcion: "Analiza documentos, extrae citas y referencias legales",
    keywords: ["analiz", "document", "cita", "referencia", "qué dice", "contenido", "extrae", "identificá"],
    prompt: (consulta, docsTexto) => `Sos un experto en derecho argentino, especializado en la Provincia de San Luis.
Analizá los siguientes documentos judiciales y respondé la consulta con precisión jurídica.
Para cada afirmación importante, indicá de qué documento proviene la cita (entre paréntesis).
Citá legislación vigente de Argentina y San Luis cuando corresponda.
Usá lenguaje técnico-jurídico apropiado.

DOCUMENTOS DEL CASO:
${docsTexto}

CONSULTA: ${consulta}

Respondé con análisis detallado, citas textuales de los documentos e identificando la fuente de cada afirmación.`,
  },
  {
    id: "abogado_defensor",
    label: "Abogado Defensor",
    icon: Shield,
    color: "bg-green-100 text-green-700",
    borderColor: "border-green-400",
    descripcion: "Construye estrategia de defensa y argumentos favorables",
    keywords: ["defensa", "estrategia", "nulidad", "prescripci", "argumento", "favorable", "atenuante", "recurso"],
    prompt: (consulta, docsTexto) => `Sos un abogado defensor experto en derecho argentino, Provincia de San Luis.
Tu rol es encontrar los mejores argumentos de defensa, identificar nulidades, prescripciones, y estrategias favorables para el cliente.
Analizá los documentos del caso y respondé desde la perspectiva del defensor.
Citá jurisprudencia de la Provincia de San Luis, Corte Suprema Argentina y legislación vigente.
Identificá posibles errores procesales, nulidades, o circunstancias atenuantes.

DOCUMENTOS DEL CASO:
${docsTexto}

CONSULTA: ${consulta}

Respondé con estrategia defensiva detallada, fundamentos legales y citas de los documentos.`,
  },
  {
    id: "analista",
    label: "Analista Jurídico",
    icon: Scale,
    color: "bg-purple-100 text-purple-700",
    borderColor: "border-purple-400",
    descripcion: "Análisis objetivo e imparcial del caso, probabilidades",
    keywords: ["probabilidad", "chance", "posibilidad", "objetivo", "imparcial", "fortaleza", "debilidad", "resultado", "ganamos", "perdem"],
    prompt: (consulta, docsTexto) => `Sos un analista jurídico imparcial experto en derecho argentino, Provincia de San Luis.
Analizá objetivamente el caso, evaluá fortalezas y debilidades de cada parte, y estimá probabilidades de resultado.
Considerá la jurisprudencia local de San Luis, tribunales de alzada y Corte Suprema Argentina.
Sé objetivo, equilibrado y preciso en tu análisis.

DOCUMENTOS DEL CASO:
${docsTexto}

CONSULTA: ${consulta}

Respondé con análisis objetivo indicando la fuente documental de cada dato.`,
  },
  {
    id: "transcriptor",
    label: "Transcriptor / Redactor",
    icon: User,
    color: "bg-orange-100 text-orange-700",
    borderColor: "border-orange-400",
    descripcion: "Redacta escritos, resume documentos y organiza información",
    keywords: ["redact", "escrib", "resum", "organiz", "carta", "nota", "escrito", "demanda", "borrador"],
    prompt: (consulta, docsTexto) => `Sos un asistente jurídico redactor experto en documentos legales argentinos, Provincia de San Luis.
Tu tarea es redactar, resumir o reorganizar información jurídica de manera clara y precisa.
Usá el formato correcto para escritos judiciales argentinos cuando corresponda.
Respetá la legislación vigente y el estilo forense de la Provincia de San Luis.

DOCUMENTOS DEL CASO:
${docsTexto}

INSTRUCCIÓN: ${consulta}

Respondé con el texto redactado o resumen solicitado de forma profesional.`,
  },
];

function sugerirAgentes(consulta) {
  if (!consulta || consulta.trim().length < 5) return [];
  const lower = consulta.toLowerCase();
  const sugeridos = agentes.filter(a => a.keywords.some(kw => lower.includes(kw))).map(a => a.id);
  // Si no hay sugerencia clara, sugerir todos
  return sugeridos.length > 0 ? sugeridos : agentes.map(a => a.id);
}

export default function AgenteIA({ caso, documentos }) {
  const [agentesSeleccionados, setAgentesSeleccionados] = useState(["lector_juridico"]);
  const [consulta, setConsulta] = useState("");
  const [docsSeleccionados, setDocsSeleccionados] = useState([]);
  const [consultandoIdx, setConsultandoIdx] = useState(null); // qué agente está procesando ahora
  const queryClient = useQueryClient();

  const { data: analisis = [] } = useQuery({
    queryKey: ["caso_analisis", caso.id],
    queryFn: () => base44.entities.CasoAnalisis.filter({ caso_id: caso.id }, "-created_date"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CasoAnalisis.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["caso_analisis", caso.id] }),
  });

  const toggleAgente = (id) => {
    setAgentesSeleccionados(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(a => a !== id) : prev) : [...prev, id]
    );
  };

  const seleccionarTodos = () => setAgentesSeleccionados(agentes.map(a => a.id));
  const sugeridos = sugerirAgentes(consulta);

  const handleSugerir = () => {
    if (sugeridos.length > 0) setAgentesSeleccionados(sugeridos);
  };

  const toggleDoc = (id) => {
    setDocsSeleccionados(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const [isPending, setIsPending] = useState(false);

  const handleConsultar = async () => {
    if (!consulta.trim() || isPending) return;
    setIsPending(true);
    const docsUsados = documentos.filter(d => docsSeleccionados.length === 0 || docsSeleccionados.includes(d.id));
    const docsTexto = docsUsados.length > 0
      ? docsUsados.map(d => `--- DOCUMENTO: "${d.titulo}" (Fuente: ${d.fuente || "No especificada"}, Fecha: ${d.fecha_documento || "No especificada"}) ---\n${d.contenido_texto || "(Sin texto)"}`).join("\n\n")
      : "(No hay documentos con texto disponibles en el caso)";

    for (let i = 0; i < agentesSeleccionados.length; i++) {
      const agenteId = agentesSeleccionados[i];
      setConsultandoIdx(agenteId);
      const agenteConfig = agentes.find(a => a.id === agenteId);
      const promptFinal = agenteConfig.prompt(consulta, docsTexto);
      const respuesta = await base44.integrations.Core.InvokeLLM({
        prompt: promptFinal,
        model: "claude_sonnet_4_6",
      });
      await base44.entities.CasoAnalisis.create({
        caso_id: caso.id,
        agente: agenteId,
        consulta,
        respuesta,
        documentos_referenciados: docsSeleccionados,
      });
      queryClient.invalidateQueries({ queryKey: ["caso_analisis", caso.id] });
    }

    setConsultandoIdx(null);
    setIsPending(false);
    setConsulta("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna principal */}
      <div className="lg:col-span-2 space-y-5">

        {/* Selector de agentes (múltiple) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Agentes a consultar ({agentesSeleccionados.length} seleccionado{agentesSeleccionados.length !== 1 ? "s" : ""})
            </Label>
            <div className="flex gap-2">
              {consulta.trim().length >= 5 && (
                <button
                  onClick={handleSugerir}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                  title="Sugerir agentes según la consulta"
                >
                  <Sparkles className="w-3 h-3" /> Sugerir
                </button>
              )}
              <button
                onClick={seleccionarTodos}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Todos
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {agentes.map(({ id, label, icon: Icon, color, borderColor, descripcion }) => {
              const selected = agentesSeleccionados.includes(id);
              const isSugerido = sugeridos.includes(id) && consulta.trim().length >= 5;
              return (
                <button
                  key={id}
                  onClick={() => toggleAgente(id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                    selected
                      ? `${borderColor} bg-primary/5`
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {isSugerido && !selected && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] bg-accent text-accent-foreground px-1 rounded font-semibold">✨ sugerido</span>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="mt-0.5">
                      {selected
                        ? <CheckSquare className="w-4 h-4 text-primary" />
                        : <Square className="w-4 h-4 text-muted-foreground/40" />
                      }
                    </div>
                  </div>
                  <p className="font-medium text-sm leading-tight">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{descripcion}</p>
                </button>
              );
            })}
          </div>
          {agentesSeleccionados.length > 1 && (
            <p className="text-xs text-primary/70 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Se consultarán {agentesSeleccionados.length} agentes en secuencia y cada respuesta se guardará por separado.
            </p>
          )}
        </div>

        {/* Selección de documentos */}
        {documentos.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Documentos a analizar ({docsSeleccionados.length === 0 ? "todos" : `${docsSeleccionados.length} seleccionados`})
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {documentos.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    docsSeleccionados.includes(doc.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/40"
                  }`}
                >
                  {doc.titulo}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sin selección = usa todos los documentos</p>
          </div>
        )}

        {/* Área de consulta */}
        <div className="space-y-3">
          <Textarea
            placeholder={`Escribí tu consulta... Ej: "¿Cuáles son los puntos más importantes?" / "Identificá inconsistencias" / "Redactá un escrito de apelación"`}
            value={consulta}
            onChange={e => setConsulta(e.target.value)}
            rows={3}
            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleConsultar(); }}
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={handleConsultar}
              disabled={!consulta.trim() || isPending}
              className="gap-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isPending
                ? `Consultando ${agentes.find(a => a.id === consultandoIdx)?.label || ""}...`
                : `Consultar${agentesSeleccionados.length > 1 ? ` (${agentesSeleccionados.length} agentes)` : ""}`
              }
            </Button>
            {isPending && (
              <p className="text-xs text-muted-foreground animate-pulse">
                {agentesSeleccionados.indexOf(consultandoIdx) + 1}/{agentesSeleccionados.length} · {agentes.find(a => a.id === consultandoIdx)?.label} analizando...
              </p>
            )}
          </div>
        </div>

        {/* Historial */}
        {analisis.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Historial de análisis</h3>
            {analisis.map((a) => {
              const ag = agentes.find(ag => ag.id === a.agente);
              return (
                <Card key={a.id} className="border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ag && <Badge className={ag.color} variant="secondary">{ag.label}</Badge>}
                        <p className="text-sm font-medium">{a.consulta}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-destructive shrink-0" onClick={() => deleteMutation.mutate(a.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {a.respuesta && (
                      <div className="prose prose-sm max-w-none text-sm border-t pt-3">
                        <ReactMarkdown>{a.respuesta}</ReactMarkdown>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {analisis.length === 0 && !isPending && (
          <div className="text-center py-8 border-2 border-dashed rounded-xl">
            <Bot className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Hacé tu primera consulta al agente de IA</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Podés seleccionar uno o varios agentes a la vez</p>
          </div>
        )}
      </div>

      {/* Columna lateral: Anotaciones */}
      <div className="lg:border-l lg:pl-6">
        <Anotaciones caso={caso} />
      </div>
    </div>
  );
}