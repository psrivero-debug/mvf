import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Bot, Send, Loader2, Scale, Shield, FileSearch, User, Trash2, Sparkles, CheckSquare, Square, Clock, Tag, Zap } from "lucide-react";
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
  {
    id: "cronologista",
    label: "Cronologista",
    icon: Clock,
    color: "bg-teal-100 text-teal-700",
    borderColor: "border-teal-400",
    descripcion: "Construye línea de tiempo y cronología de hechos del caso",
    keywords: ["cronolog", "línea de tiempo", "timeline", "orden", "fechas", "secuencia", "cuando", "cuándo", "histor"],
    prompt: (consulta, docsTexto) => `Sos un experto en análisis cronológico de causas judiciales argentinas, Provincia de San Luis.
Tu tarea es construir una línea de tiempo precisa y ordenada de todos los hechos, actos procesales y eventos relevantes del caso.

INSTRUCCIONES:
- Extraé TODAS las fechas mencionadas en los documentos (fechas de hechos, presentaciones, notificaciones, sentencias, plazos, etc.)
- Ordenalas cronológicamente de más antigua a más reciente
- Para cada evento indicá: fecha exacta (o aproximada si no hay exacta), descripción del hecho/acto, fuente documental entre corchetes
- Marcá con ⚠️ los eventos procesalmente críticos (vencimientos, plazos, notificaciones, resoluciones)
- Marcá con ⚖️ los actos judiciales formales
- Marcá con 📄 los escritos y presentaciones de partes
- Al final, destacá cualquier brecha temporal sospechosa o plazo que pueda ser relevante jurídicamente

DOCUMENTOS DEL CASO:
${docsTexto}

INSTRUCCIÓN ADICIONAL: ${consulta}

Presentá la línea de tiempo en formato claro, ordenada cronológicamente, con cada evento en una línea separada.`,
  },
  {
    id: "extractor_keywords",
    label: "Extractor de Keywords",
    icon: Tag,
    color: "bg-pink-100 text-pink-700",
    borderColor: "border-pink-400",
    descripcion: "Extrae palabras clave, personas, montos y datos críticos",
    keywords: ["keyword", "palabra", "clave", "persona", "monto", "dato", "nombre", "actor", "demandado", "partes", "número", "importe"],
    prompt: (consulta, docsTexto) => `Sos un analista forense especializado en extracción de información de documentos jurídicos argentinos, Provincia de San Luis.
Tu tarea es identificar y extraer sistemáticamente toda la información estructurada relevante del caso.

EXTRAE Y ORGANIZA EN SECCIONES:

1. **PARTES INVOLUCRADAS**: Nombres completos, DNI/CUIT, domicilios, roles (actor, demandado, testigo, perito, juez, fiscal, etc.)
2. **PALABRAS CLAVE JURÍDICAS**: Términos legales centrales del caso, figuras jurídicas involucradas, artículos citados
3. **MONTOS Y VALORES**: Todos los montos económicos mencionados, con fecha y contexto
4. **EXPEDIENTES Y REFERENCIAS**: Números de expediente, resoluciones, tomos, folios, registros
5. **LUGARES Y JURISDICCIONES**: Domicilios, juzgados, organismos, localidades mencionadas
6. **HECHOS CENTRALES**: Los 5-10 hechos más importantes del caso en bullets concisos
7. **CONCEPTOS JURÍDICOS APLICABLES**: Leyes, artículos, jurisprudencia mencionada o aplicable
8. **CONTRADICCIONES Y ALERTAS**: Datos inconsistentes, contradicciones entre documentos, puntos débiles ⚠️

DOCUMENTOS DEL CASO:
${docsTexto}

INSTRUCCIÓN ADICIONAL: ${consulta}

Respondé con las secciones bien organizadas y diferenciadas, priorizando exhaustividad y precisión.`,
  },
];

// Acciones rápidas predefinidas agrupadas por categoría
const accionesRapidas = [
  {
    categoria: "Análisis",
    icono: "🔍",
    acciones: [
      { label: "Palabras clave y datos críticos", texto: "Extraé todas las palabras clave, partes, montos, expedientes y datos críticos del caso.", agentes: ["extractor_keywords"] },
      { label: "Inconsistencias y contradicciones", texto: "Identificá todas las inconsistencias, contradicciones y puntos débiles entre los documentos.", agentes: ["lector_juridico", "analista"] },
      { label: "Puntos fuertes y débiles", texto: "Analizá los puntos fuertes y débiles del caso para cada parte.", agentes: ["analista"] },
      { label: "Resumen ejecutivo del caso", texto: "Generá un resumen ejecutivo completo del caso con los hechos principales, partes, estado procesal y perspectivas.", agentes: ["lector_juridico", "analista"] },
    ]
  },
  {
    categoria: "Cronología",
    icono: "📅",
    acciones: [
      { label: "Línea de tiempo completa", texto: "Construí una línea de tiempo cronológica completa con todos los hechos y actos procesales del caso.", agentes: ["cronologista"] },
      { label: "Plazos procesales críticos", texto: "Identificá todos los plazos procesales, vencimientos y fechas críticas del expediente.", agentes: ["cronologista", "lector_juridico"] },
      { label: "Secuencia de notificaciones", texto: "Ordená cronológicamente todas las notificaciones, cédulas y comunicaciones del proceso.", agentes: ["cronologista"] },
    ]
  },
  {
    categoria: "Estrategia",
    icono: "⚖️",
    acciones: [
      { label: "Estrategia de defensa completa", texto: "Desarrollá una estrategia de defensa completa, identificando nulidades, prescripciones y argumentos favorables.", agentes: ["abogado_defensor"] },
      { label: "Probabilidad de éxito", texto: "Estimá objetivamente la probabilidad de éxito del caso con fundamentos y jurisprudencia.", agentes: ["analista"] },
      { label: "Análisis integral 360°", texto: "Realizá un análisis integral del caso: extracción de datos, cronología, fortalezas/debilidades y estrategia de defensa.", agentes: ["extractor_keywords", "cronologista", "analista", "abogado_defensor"] },
    ]
  },
  {
    categoria: "Redacción",
    icono: "✍️",
    acciones: [
      { label: "Borrador de escrito inicial", texto: "Redactá un borrador de escrito judicial inicial basado en los hechos del caso.", agentes: ["transcriptor"] },
      { label: "Resumen para cliente", texto: "Redactá un resumen claro y sin tecnicismos del estado del caso para explicarle al cliente.", agentes: ["transcriptor"] },
    ]
  },
];

function sugerirAgentes(consulta) {
  if (!consulta || consulta.trim().length < 5) return [];
  const lower = consulta.toLowerCase();
  const sugeridos = agentes.filter(a => a.keywords.some(kw => lower.includes(kw))).map(a => a.id);
  return sugeridos.length > 0 ? sugeridos : agentes.map(a => a.id);
}

export default function AgenteIA({ caso, documentos }) {
  const [agentesSeleccionados, setAgentesSeleccionados] = useState(["lector_juridico"]);
  const [consulta, setConsulta] = useState("");
  const [docsSeleccionados, setDocsSeleccionados] = useState([]);
  const [consultandoIdx, setConsultandoIdx] = useState(null);
  const [isPending, setIsPending] = useState(false);
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

  const aplicarAccionRapida = (accion) => {
    setConsulta(accion.texto);
    setAgentesSeleccionados(accion.agentes);
  };

  const ejecutarConsulta = async (consultaTexto, agentesIds) => {
    if (!consultaTexto.trim() || isPending) return;
    setIsPending(true);
    const docsUsados = documentos.filter(d => docsSeleccionados.length === 0 || docsSeleccionados.includes(d.id));
    const docsTexto = docsUsados.length > 0
      ? docsUsados.map(d => `--- DOCUMENTO: "${d.titulo}" (Fuente: ${d.fuente || "No especificada"}, Fecha: ${d.fecha_documento || "No especificada"}) ---\n${d.contenido_texto || "(Sin texto)"}`).join("\n\n")
      : "(No hay documentos con texto disponibles en el caso)";

    for (const agenteId of agentesIds) {
      setConsultandoIdx(agenteId);
      const agenteConfig = agentes.find(a => a.id === agenteId);
      const promptFinal = agenteConfig.prompt(consultaTexto, docsTexto);
      const respuesta = await base44.integrations.Core.InvokeLLM({
        prompt: promptFinal,
        model: "claude_sonnet_4_6",
      });
      await base44.entities.CasoAnalisis.create({
        caso_id: caso.id,
        agente: agenteId,
        consulta: consultaTexto,
        respuesta,
        documentos_referenciados: docsSeleccionados,
      });
      queryClient.invalidateQueries({ queryKey: ["caso_analisis", caso.id] });
    }

    setConsultandoIdx(null);
    setIsPending(false);
    setConsulta("");
  };

  const handleConsultar = () => ejecutarConsulta(consulta, agentesSeleccionados);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna principal */}
      <div className="lg:col-span-2 space-y-5">

        {/* ACCIONES RÁPIDAS */}
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold">Acciones rápidas</span>
            <span className="text-xs text-muted-foreground">· Click para usar</span>
          </div>
          <div className="space-y-3">
            {accionesRapidas.map(grupo => (
              <div key={grupo.categoria}>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">{grupo.icono} {grupo.categoria}</p>
                <div className="flex flex-wrap gap-2">
                  {grupo.acciones.map(accion => (
                    <button
                      key={accion.label}
                      onClick={() => aplicarAccionRapida(accion)}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg text-xs border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all text-left disabled:opacity-40"
                    >
                      {accion.label}
                      {accion.agentes.length > 1 && (
                        <span className="ml-1 text-[10px] text-muted-foreground">({accion.agentes.length} agentes)</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selector de agentes (múltiple) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Agentes a consultar ({agentesSeleccionados.length} seleccionado{agentesSeleccionados.length !== 1 ? "s" : ""})
            </Label>
            <div className="flex gap-3">
              {consulta.trim().length >= 5 && (
                <button
                  onClick={handleSugerir}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Sparkles className="w-3 h-3" /> Sugerir
                </button>
              )}
              <button onClick={seleccionarTodos} className="text-xs text-muted-foreground hover:text-foreground underline">
                Todos
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {agentes.map(({ id, label, icon: Icon, color, borderColor, descripcion }) => {
              const selected = agentesSeleccionados.includes(id);
              const isSugerido = sugeridos.includes(id) && consulta.trim().length >= 5;
              return (
                <button
                  key={id}
                  onClick={() => toggleAgente(id)}
                  className={`p-2.5 rounded-xl border-2 text-left transition-all relative ${
                    selected ? `${borderColor} bg-primary/5` : "border-border hover:border-primary/40"
                  }`}
                >
                  {isSugerido && !selected && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] bg-accent text-accent-foreground px-1 rounded font-semibold">✨</span>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    {selected
                      ? <CheckSquare className="w-3.5 h-3.5 text-primary ml-auto" />
                      : <Square className="w-3.5 h-3.5 text-muted-foreground/30 ml-auto" />
                    }
                  </div>
                  <p className="font-medium text-xs leading-tight">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{descripcion}</p>
                </button>
              );
            })}
          </div>
          {agentesSeleccionados.length > 1 && (
            <p className="text-xs text-primary/70 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Se consultarán {agentesSeleccionados.length} agentes en secuencia.
            </p>
          )}
        </div>

        {/* Selección de documentos */}
        {documentos.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Documentos ({docsSeleccionados.length === 0 ? "todos" : `${docsSeleccionados.length} seleccionados`})
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
            placeholder={`Escribí tu consulta personalizada o usá una acción rápida de arriba... (Ctrl+Enter para enviar)`}
            value={consulta}
            onChange={e => setConsulta(e.target.value)}
            rows={3}
            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleConsultar(); }}
          />
          <div className="flex items-center gap-3">
            <Button onClick={handleConsultar} disabled={!consulta.trim() || isPending} className="gap-2">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isPending
                ? `Consultando ${agentes.find(a => a.id === consultandoIdx)?.label || ""}...`
                : `Consultar${agentesSeleccionados.length > 1 ? ` (${agentesSeleccionados.length} agentes)` : ""}`
              }
            </Button>
            {isPending && (
              <p className="text-xs text-muted-foreground animate-pulse">
                {agentesSeleccionados.indexOf(consultandoIdx) + 1}/{agentesSeleccionados.length} · {agentes.find(a => a.id === consultandoIdx)?.label}...
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
            <p className="text-sm text-muted-foreground">Usá una acción rápida o escribí tu consulta</p>
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