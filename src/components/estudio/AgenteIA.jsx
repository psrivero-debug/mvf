import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Bot, Send, Loader2, Scale, Shield, FileSearch, User, Trash2, Sparkles, CheckSquare, Square, Clock, Tag, Zap, Printer } from "lucide-react";
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
Usá lenguaje técnico-jurídico apropiado.

SISTEMA DE CITAS OBLIGATORIO:
- Cada vez que hagas una afirmación basada en un documento, colocá un número superíndice al final de la frase: ¹ ² ³ ⁴ ⁵ etc.
- Al final de tu respuesta, incluí una sección titulada "**Referencias:**" con la lista numerada de cada cita en el formato:
  ¹ [Título del documento] — Fuente: [fuente] | Fecha: [fecha si existe]
- Si citás legislación o jurisprudencia (no documentos del caso), indicalo como: [Ley/Art. X] sin superíndice.

DOCUMENTOS DEL CASO:
${docsTexto}

CONSULTA: ${consulta}

Respondé con análisis detallado, usando superíndices en cada afirmación y la lista de referencias al final.`,
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

SISTEMA DE CITAS OBLIGATORIO:
- Cada vez que hagas una afirmación basada en un documento, colocá un número superíndice al final de la frase: ¹ ² ³ ⁴ ⁵ etc.
- Al final de tu respuesta, incluí una sección titulada "**Referencias:**" con la lista numerada de cada cita en el formato:
  ¹ [Título del documento] — Fuente: [fuente] | Fecha: [fecha si existe]
- Si citás legislación o jurisprudencia (no documentos del caso), indicalo como: [Ley/Art. X] sin superíndice.

DOCUMENTOS DEL CASO:
${docsTexto}

CONSULTA: ${consulta}

Respondé con estrategia defensiva detallada, usando superíndices en cada afirmación y la lista de referencias al final.`,
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

SISTEMA DE CITAS OBLIGATORIO:
- Cada vez que hagas una afirmación basada en un documento, colocá un número superíndice al final de la frase: ¹ ² ³ ⁴ ⁵ etc.
- Al final de tu respuesta, incluí una sección titulada "**Referencias:**" con la lista numerada de cada cita en el formato:
  ¹ [Título del documento] — Fuente: [fuente] | Fecha: [fecha si existe]
- Si citás legislación o jurisprudencia (no documentos del caso), indicalo como: [Ley/Art. X] sin superíndice.

DOCUMENTOS DEL CASO:
${docsTexto}

CONSULTA: ${consulta}

Respondé con análisis objetivo usando superíndices en cada afirmación y la lista de referencias al final.`,
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

SISTEMA DE CITAS OBLIGATORIO:
- Cada vez que uses información de un documento del caso, colocá un número superíndice al final de la frase: ¹ ² ³ ⁴ ⁵ etc.
- Al final de tu respuesta, incluí una sección titulada "**Referencias:**" con la lista numerada de cada cita en el formato:
  ¹ [Título del documento] — Fuente: [fuente] | Fecha: [fecha si existe]

DOCUMENTOS DEL CASO:
${docsTexto}

INSTRUCCIÓN: ${consulta}

Respondé con el texto redactado o resumen solicitado, usando superíndices y referencias al final.`,
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

SISTEMA DE CITAS OBLIGATORIO:
- Cada evento debe indicar entre corchetes el documento del que proviene: [Doc: "Título del documento"]
- Al final, incluí una sección "**Referencias:**" con la lista de documentos usados en el formato:
  ¹ [Título del documento] — Fuente: [fuente] | Fecha: [fecha si existe]

DOCUMENTOS DEL CASO:
${docsTexto}

INSTRUCCIÓN ADICIONAL: ${consulta}

Presentá la línea de tiempo en formato claro, ordenada cronológicamente, con cada evento en una línea separada y su fuente documental.`,
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

SISTEMA DE CITAS OBLIGATORIO:
- Cada dato extraído debe indicar con superíndice el documento fuente: ¹ ² ³ etc.
- Al final, incluí una sección "**Referencias:**" con la lista en el formato:
  ¹ [Título del documento] — Fuente: [fuente] | Fecha: [fecha si existe]

DOCUMENTOS DEL CASO:
${docsTexto}

INSTRUCCIÓN ADICIONAL: ${consulta}

Respondé con las secciones bien organizadas, superíndices en cada dato y referencias al final.`,
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

function RespuestaAnalisis({ respuesta, caso, agente }) {
  const [texto, setTexto] = useState(null);
  const [textoSeleccionado, setTextoSeleccionado] = useState("");
  const textRef = useRef(null);

  useEffect(() => {
    if (!respuesta) return;
    if (respuesta.startsWith("http://") || respuesta.startsWith("https://")) {
      fetch(respuesta).then(r => r.text()).then(setTexto).catch(() => setTexto(respuesta));
    } else {
      setTexto(respuesta);
    }
  }, [respuesta]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection().toString().trim();
      setTextoSeleccionado(selection);
    };
    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("touchend", handleSelectionChange);
    return () => {
      document.removeEventListener("mouseup", handleSelectionChange);
      document.removeEventListener("touchend", handleSelectionChange);
    };
  }, []);

  if (!texto) return <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3"><Loader2 className="w-3 h-3 animate-spin" /> Cargando respuesta...</div>;

  return (
    <div className="border-t pt-3">
      {textoSeleccionado && (
        <div className="mb-3 p-2 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-between">
          <span className="text-xs text-accent">{textoSeleccionado.length} caracteres seleccionados</span>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 text-xs text-accent hover:text-accent/80"
            onClick={() => {
              const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
              const w = window.open("", "_blank");
              w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
                <style>
                  * { margin: 0; padding: 0; }
                  body { font-family: 'Arial', sans-serif; color: #222; background: #fff; }
                  .page { max-width: 900px; margin: 0 auto; }
                  .header { background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; padding: 30px 40px; text-align: center; }
                  .header-content { display: flex; align-items: center; justify-content: center; gap: 15px; }
                  .logo { width: 50px; height: 50px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #1e3a5f; font-size: 24px; }
                  .header-text { text-align: left; }
                  .header h1 { font-size: 24px; font-weight: bold; }
                  .header p { font-size: 12px; opacity: 0.9; margin-top: 2px; }
                  .content { padding: 40px; }
                  .metadata { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; font-size: 12px; color: #666; background: #f9f9f9; padding: 15px; border-radius: 6px; }
                  .metadata-row { display: flex; gap: 5px; }
                  .metadata-label { font-weight: bold; min-width: 100px; }
                  .extract { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.8; color: #333; background: #f9f9f9; padding: 20px; border-radius: 6px; border-left: 4px solid #1e3a5f; }
                  .footer { padding: 20px 40px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; background: #f9f9f9; }
                  @media print { body { margin: 0; padding: 0; } .page { max-width: 100%; } }
                </style>
              </head><body>
                <div class="page">
                  <div class="header">
                    <div class="header-content">
                      <div class="logo">⚖️</div>
                      <div class="header-text">
                        <h1>Pérez & Funes</h1>
                        <p>Estudio Jurídico · Negocios Inmobiliarios</p>
                      </div>
                    </div>
                  </div>
                  <div class="content">
                    <div class="metadata">
                      <div class="metadata-row">
                        <span class="metadata-label">Caso:</span>
                        <span>${caso?.titulo || "—"}</span>
                      </div>
                      <div class="metadata-row">
                        <span class="metadata-label">Agente:</span>
                        <span>${agente || "—"}</span>
                      </div>
                      <div class="metadata-row">
                        <span class="metadata-label">Fecha:</span>
                        <span>${hoy}</span>
                      </div>
                    </div>
                    <div class="extract">${textoSeleccionado}</div>
                  </div>
                  <div class="footer">
                    <p>Documento generado por el Sistema de Análisis - Estudio Jurídico Pérez & Funes</p>
                  </div>
                </div>
              </body></html>`);
              w.document.close();
              w.print();
            }}
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir selección
          </Button>
        </div>
      )}
      <div ref={textRef} className="prose prose-sm max-w-none text-sm">
        <ReactMarkdown>{texto}</ReactMarkdown>
      </div>
    </div>
  );
}

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
  const [analisisSeleccionados, setAnalisisSeleccionados] = useState(new Set());
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

  // Si contenido_texto es una URL (texto largo subido como archivo), hace fetch del contenido real
  const resolverContenido = async (doc) => {
    const texto = doc.contenido_texto;
    if (!texto) return "(Sin texto)";
    if (texto.startsWith("http://") || texto.startsWith("https://")) {
      try {
        const res = await fetch(texto);
        return await res.text();
      } catch {
        return texto;
      }
    }
    return texto;
  };

  const ejecutarConsulta = async (consultaTexto, agentesIds) => {
    if (!consultaTexto.trim() || isPending) return;
    setIsPending(true);
    const docsUsados = documentos.filter(d => docsSeleccionados.length === 0 || docsSeleccionados.includes(d.id));

    // Resolver contenido real de cada documento (incluyendo los guardados como URL)
    const docsConTexto = await Promise.all(
      docsUsados.map(async d => ({
        ...d,
        contenido_resuelto: await resolverContenido(d),
      }))
    );

    const docsTexto = docsConTexto.length > 0
      ? docsConTexto.map(d => `--- DOCUMENTO: "${d.titulo}" (Fuente: ${d.fuente || "No especificada"}, Fecha: ${d.fecha_documento || "No especificada"}) ---\n${d.contenido_resuelto}`).join("\n\n")
      : "(No hay documentos con texto disponibles en el caso)";

    for (const agenteId of agentesIds) {
      setConsultandoIdx(agenteId);
      const agenteConfig = agentes.find(a => a.id === agenteId);
      const promptFinal = agenteConfig.prompt(consultaTexto, docsTexto);
      let respuesta = await base44.integrations.Core.InvokeLLM({
        prompt: promptFinal,
        model: "claude_sonnet_4_6",
      });
      // Si la respuesta es muy larga, subirla como archivo y guardar la URL
      if (respuesta && respuesta.length > 8000) {
        const blob = new Blob([respuesta], { type: "text/plain" });
        const txtFile = new File([blob], `analisis_${Date.now()}.txt`, { type: "text/plain" });
        const { file_url } = await base44.integrations.Core.UploadFile({ file: txtFile });
        respuesta = file_url;
      }
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
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Historial de análisis ({analisisSeleccionados.size})</h3>
              {analisisSeleccionados.size > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 text-xs"
                  onClick={async () => {
                    const analisisAImprimir = analisis.filter(a => analisisSeleccionados.has(a.id));
                    const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                    
                    const analisisConTexto = await Promise.all(
                      analisisAImprimir.map(async (a) => {
                        let texto = a.respuesta || "";
                        if (texto.startsWith("http://") || texto.startsWith("https://")) {
                          try { texto = await fetch(texto).then(r => r.text()); } catch {}
                        }
                        return { ...a, textoResuelto: texto };
                      })
                    );

                    const w = window.open("", "_blank");
                    const contenidoAnalisis = analisisConTexto.map((a, idx) => {
                      const ag = agentes.find(ag => ag.id === a.agente);
                      return `<div style="page-break-after: always; padding: 20px 0; border-bottom: 2px solid #ddd;">
                        <div style="display: inline-block; background: #2c5282; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-bottom: 15px;">${ag?.label || "Análisis"}</div>
                        <p style="font-size: 12px; color: #666; margin: 5px 0;"><strong>Consulta:</strong> ${a.consulta}</p>
                        <p style="font-size: 12px; color: #666; margin: 5px 0;"><strong>Agente:</strong> ${ag?.label || "—"}</p>
                        <div style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.8; color: #333; margin-top: 15px;">${a.textoResuelto}</div>
                      </div>`;
                    }).join("");

                    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
                      <style>
                        * { margin: 0; padding: 0; }
                        body { font-family: 'Arial', sans-serif; color: #222; background: #fff; }
                        .page { max-width: 900px; margin: 0 auto; }
                        .header { background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; padding: 30px 40px; text-align: center; }
                        .header-content { display: flex; align-items: center; justify-content: center; gap: 15px; }
                        .logo { width: 50px; height: 50px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #1e3a5f; font-size: 24px; }
                        .header-text { text-align: left; }
                        .header h1 { font-size: 24px; font-weight: bold; }
                        .header p { font-size: 12px; opacity: 0.9; margin-top: 2px; }
                        .content { padding: 40px; }
                        .metadata { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; font-size: 12px; color: #666; background: #f9f9f9; padding: 15px; border-radius: 6px; }
                        .metadata-row { display: flex; gap: 5px; }
                        .metadata-label { font-weight: bold; min-width: 100px; }
                        .footer { padding: 20px 40px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; background: #f9f9f9; }
                        @media print { 
                          body { margin: 0; padding: 0; }
                          .page { max-width: 100%; }
                        }
                      </style>
                    </head><body>
                      <div class="page">
                        <div class="header">
                          <div class="header-content">
                            <div class="logo">⚖️</div>
                            <div class="header-text">
                              <h1>Pérez & Funes</h1>
                              <p>Estudio Jurídico · Negocios Inmobiliarios</p>
                            </div>
                          </div>
                        </div>
                        <div class="content">
                          <div class="metadata">
                            <div class="metadata-row">
                              <span class="metadata-label">Caso:</span>
                              <span>${caso.titulo}</span>
                            </div>
                            <div class="metadata-row">
                              <span class="metadata-label">Análisis:</span>
                              <span>${analisisSeleccionados.size} documento${analisisSeleccionados.size > 1 ? "s" : ""}</span>
                            </div>
                            <div class="metadata-row">
                              <span class="metadata-label">Fecha:</span>
                              <span>${hoy}</span>
                            </div>
                          </div>
                          ${contenidoAnalisis}
                        </div>
                        <div class="footer">
                          <p>Documento generado por el Sistema de Análisis - Estudio Jurídico Pérez & Funes</p>
                        </div>
                      </div>
                    </body></html>`);
                    w.document.close();
                    w.print();
                  }}
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir selección ({analisisSeleccionados.size})
                </Button>
              )}
            </div>
            {analisis.map((a) => {
              const ag = agentes.find(ag => ag.id === a.agente);
              const isSelected = analisisSeleccionados.has(a.id);
              return (
                <Card key={a.id} className={`border shadow-sm transition-all ${isSelected ? "bg-primary/5 border-primary" : ""}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-wrap flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(analisisSeleccionados);
                            if (e.target.checked) newSet.add(a.id);
                            else newSet.delete(a.id);
                            setAnalisisSeleccionados(newSet);
                          }}
                          className="rounded mt-0.5"
                        />
                        {ag && <Badge className={ag.color} variant="secondary">{ag.label}</Badge>}
                        <p className="text-sm font-medium">{a.consulta}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                          title="Imprimir análisis"
                          onClick={async () => {
                            let texto = a.respuesta || "";
                            if (texto.startsWith("http://") || texto.startsWith("https://")) {
                              try { texto = await fetch(texto).then(r => r.text()); } catch {}
                            }
                            const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                            const w = window.open("", "_blank");
                            w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
                              <style>
                                * { margin: 0; padding: 0; }
                                body { font-family: 'Arial', sans-serif; color: #222; background: #fff; }
                                .page { max-width: 900px; margin: 0 auto; }
                                .header { background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; padding: 30px 40px; text-align: center; }
                                .header-content { display: flex; align-items: center; justify-content: center; gap: 15px; }
                                .logo { width: 50px; height: 50px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #1e3a5f; font-size: 24px; }
                                .header-text { text-align: left; }
                                .header h1 { font-size: 24px; font-weight: bold; }
                                .header p { font-size: 12px; opacity: 0.9; margin-top: 2px; }
                                .content { padding: 40px; }
                                .metadata { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; font-size: 12px; color: #666; background: #f9f9f9; padding: 15px; border-radius: 6px; }
                                .metadata-row { display: flex; gap: 5px; }
                                .metadata-label { font-weight: bold; min-width: 100px; }
                                .agent-badge { display: inline-block; background: #2c5282; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-bottom: 15px; }
                                .analysis-title { font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; }
                                .analysis-text { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.8; color: #333; }
                                .footer { padding: 20px 40px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; background: #f9f9f9; }
                                @media print { 
                                  body { margin: 0; padding: 0; }
                                  .page { max-width: 100%; }
                                }
                              </style>
                            </head><body>
                              <div class="page">
                                <div class="header">
                                  <div class="header-content">
                                    <div class="logo">⚖️</div>
                                    <div class="header-text">
                                      <h1>Pérez & Funes</h1>
                                      <p>Estudio Jurídico · Negocios Inmobiliarios</p>
                                    </div>
                                  </div>
                                </div>
                                <div class="content">
                                  <div class="agent-badge">${ag?.label || "Análisis"}</div>
                                  <div class="metadata">
                                    <div class="metadata-row">
                                      <span class="metadata-label">Caso:</span>
                                      <span>${caso.titulo}</span>
                                    </div>
                                    <div class="metadata-row">
                                      <span class="metadata-label">Consulta:</span>
                                      <span>${a.consulta}</span>
                                    </div>
                                    <div class="metadata-row">
                                      <span class="metadata-label">Fecha:</span>
                                      <span>${hoy}</span>
                                    </div>
                                  </div>
                                  <div class="analysis-text">${texto}</div>
                                </div>
                                <div class="footer">
                                  <p>Documento generado por el Sistema de Análisis - Estudio Jurídico Pérez & Funes</p>
                                </div>
                              </div>
                            </body></html>`);
                            w.document.close();
                            w.print();
                          }}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(a.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {a.respuesta && (
                      <RespuestaAnalisis respuesta={a.respuesta} caso={caso} agente={ag?.label} />
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