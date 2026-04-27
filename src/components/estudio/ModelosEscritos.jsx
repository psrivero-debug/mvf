import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Printer, Copy, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

const MARCO_NORMATIVO = `
=== MARCO NORMATIVO APLICABLE (PROVINCIA DE SAN LUIS) ===
- Código de Familia de San Luis (Ley I-0007-2004)
- Código Procesal Civil y Comercial de San Luis (Ley I-0002-2004)
- Código Procesal Penal de San Luis (Ley II-0009-2005)
- Código Procesal Laboral de San Luis (Ley I-0783-2004)
- Ley de Contrato de Trabajo (Ley 20.744)
=== FIN MARCO NORMATIVO ===
`;

const modelos = [
  {
    id: "demanda",
    label: "Demanda",
    color: "bg-blue-100 text-blue-700",
    descripcion: "Escrito inicial de demanda judicial",
    prompt: (caso, extra) => `Redactá una DEMANDA JUDICIAL completa y formal para la Justicia de la Provincia de San Luis, siguiendo el formato y estilo forense local.

${MARCO_NORMATIVO}

DATOS DEL CASO:
- Carátula: ${caso.titulo}
- Cliente/Actor: ${caso.client_name || "—"}
- Tipo de caso: ${caso.tipo_caso || "—"}
- Jurisdicción: ${caso.jurisdiccion || "Juzgado competente de San Luis"}
- Partes: ${caso.partes || "—"}
- Hechos: ${caso.hechos_resumen || caso.descripcion || "—"}
- Número de expediente: ${caso.numero_expediente || "A iniciar"}
${extra ? `\nInstrucciones adicionales: ${extra}` : ""}

ESTRUCTURA REQUERIDA:
1. Encabezado (juzgado, autos, carátula)
2. I. OBJETO (pretensión concreta)
3. II. HECHOS (numerados, cronológicos, detallados)
4. III. DERECHO (fundamentos legales, artículos aplicables según el marco normativo de San Luis)
5. IV. PRUEBA (documental, testimonial, pericial según corresponda)
6. V. PETITORIO (lo que se pide al juzgado, numerado)
7. Firma y datos del letrado

Usá lenguaje forense formal. Completá con [COMPLETAR: descripción] los campos que requieran datos específicos del caso.`,
  },
  {
    id: "contestacion",
    label: "Contestación de Demanda",
    color: "bg-green-100 text-green-700",
    descripcion: "Escrito de contestación a una demanda recibida",
    prompt: (caso, extra) => `Redactá una CONTESTACIÓN DE DEMANDA completa y formal para la Justicia de la Provincia de San Luis.

${MARCO_NORMATIVO}

DATOS DEL CASO:
- Carátula: ${caso.titulo}
- Cliente/Demandado: ${caso.client_name || "—"}
- Tipo de caso: ${caso.tipo_caso || "—"}
- Jurisdicción: ${caso.jurisdiccion || "Juzgado competente de San Luis"}
- Partes: ${caso.partes || "—"}
- Hechos: ${caso.hechos_resumen || caso.descripcion || "—"}
${extra ? `\nInstrucciones adicionales: ${extra}` : ""}

ESTRUCTURA REQUERIDA:
1. Encabezado
2. I. OBJETO (contestar demanda, negar hechos)
3. II. NIEGA (negación específica de cada hecho de la demanda)
4. III. HECHOS DE LA DEFENSA (versión del demandado)
5. IV. DERECHO (fundamentos legales y excepciones aplicables)
6. V. EXCEPCIONES (si corresponden: prescripción, falta de legitimación, etc.)
7. VI. PRUEBA
8. VII. PETITORIO
9. Firma

Usá lenguaje forense formal. Completá con [COMPLETAR: descripción] los campos que requieran datos específicos.`,
  },
  {
    id: "medida_cautelar",
    label: "Medida Cautelar",
    color: "bg-orange-100 text-orange-700",
    descripcion: "Solicitud de medida cautelar (embargo, inhibición, etc.)",
    prompt: (caso, extra) => `Redactá un escrito de MEDIDA CAUTELAR para la Justicia de la Provincia de San Luis, conforme al art. 230 y ss. del CPCC San Luis.

${MARCO_NORMATIVO}

DATOS DEL CASO:
- Carátula: ${caso.titulo}
- Cliente: ${caso.client_name || "—"}
- Tipo de caso: ${caso.tipo_caso || "—"}
- Jurisdicción: ${caso.jurisdiccion || "Juzgado competente de San Luis"}
- Partes: ${caso.partes || "—"}
- Hechos: ${caso.hechos_resumen || caso.descripcion || "—"}
${extra ? `\nTipo de cautelar y motivo: ${extra}` : ""}

ESTRUCTURA REQUERIDA:
1. Encabezado
2. I. OBJETO (tipo de medida cautelar solicitada)
3. II. VEROSIMILITUD DEL DERECHO (fumus boni iuris)
4. III. PELIGRO EN LA DEMORA (periculum in mora)
5. IV. CONTRACAUTELA ofrecida
6. V. DERECHO (art. 230 y ss. CPCC San Luis y normas aplicables)
7. VI. PETITORIO
8. Firma

Usá lenguaje forense formal. Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "recurso_apelacion",
    label: "Recurso de Apelación",
    color: "bg-purple-100 text-purple-700",
    descripcion: "Recurso de apelación contra resolución o sentencia",
    prompt: (caso, extra) => `Redactá un RECURSO DE APELACIÓN completo para la Justicia de la Provincia de San Luis.

${MARCO_NORMATIVO}

DATOS DEL CASO:
- Carátula: ${caso.titulo}
- Cliente/Recurrente: ${caso.client_name || "—"}
- Jurisdicción: ${caso.jurisdiccion || "Cámara de Apelaciones de San Luis"}
- Partes: ${caso.partes || "—"}
${extra ? `\nResolución impugnada y agravios: ${extra}` : ""}

ESTRUCTURA REQUERIDA:
1. Encabezado (Excma. Cámara de Apelaciones)
2. I. OBJETO (interposición del recurso)
3. II. ADMISIBILIDAD (plazo, forma, legitimación)
4. III. HECHOS RELEVANTES
5. IV. AGRAVIOS (cada agravio numerado y fundado)
6. V. DERECHO
7. VI. PETITORIO (revocación o modificación)
8. Firma

Usá lenguaje forense formal. Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "denuncia_penal",
    label: "Denuncia Penal",
    color: "bg-red-100 text-red-700",
    descripcion: "Denuncia penal ante Fiscalía o Juzgado de instrucción",
    prompt: (caso, extra) => `Redactá una DENUNCIA PENAL formal ante la Fiscalía de la Provincia de San Luis, conforme al CPP San Luis (Ley II-0009-2005).

${MARCO_NORMATIVO}

DATOS DEL CASO:
- Carátula: ${caso.titulo}
- Denunciante/Cliente: ${caso.client_name || "—"}
- Jurisdicción: ${caso.jurisdiccion || "Fiscalía competente de San Luis"}
- Partes: ${caso.partes || "—"}
- Hechos: ${caso.hechos_resumen || caso.descripcion || "—"}
${extra ? `\nHechos delictivos y calificación: ${extra}` : ""}

ESTRUCTURA REQUERIDA:
1. Encabezado (Fiscalía / Juzgado)
2. I. DATOS DEL DENUNCIANTE
3. II. DATOS DEL DENUNCIADO
4. III. HECHOS (relato cronológico y detallado)
5. IV. CALIFICACIÓN LEGAL (tipo penal aplicable)
6. V. PRUEBA OFRECIDA
7. VI. PETITORIO (investigación, medidas de protección si corresponde)
8. Firma

Usá lenguaje formal. Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "carta_documento",
    label: "Carta Documento",
    color: "bg-yellow-100 text-yellow-700",
    descripcion: "Carta documento fehaciente extrajudicial",
    prompt: (caso, extra) => `Redactá una CARTA DOCUMENTO extrajudicial, con tono formal y fehaciente, conforme al derecho argentino.

${MARCO_NORMATIVO}

DATOS DEL CASO:
- Remitente/Cliente: ${caso.client_name || "—"}
- Destinatario: ${caso.partes || "[COMPLETAR: destinatario]"}
- Tipo de asunto: ${caso.tipo_caso || "—"}
- Hechos: ${caso.hechos_resumen || caso.descripcion || "—"}
${extra ? `\nMotivo y reclamo: ${extra}` : ""}

ESTRUCTURA REQUERIDA:
1. Lugar y fecha
2. Datos del destinatario
3. Me dirijo a Ud. en mi carácter de...
4. OBJETO (intimación, reclamo, notificación)
5. HECHOS que motivan la carta
6. FUNDAMENTO LEGAL
7. INTIMACIÓN concreta con plazo
8. Consecuencias del incumplimiento
9. Firma y aclaración

Usá tono formal, directo y fehaciente. Completá con [COMPLETAR] los datos faltantes.`,
  },
  {
    id: "escrito_laboral",
    label: "Demanda Laboral",
    color: "bg-teal-100 text-teal-700",
    descripcion: "Demanda laboral ante la Cámara del Trabajo de San Luis",
    prompt: (caso, extra) => `Redactá una DEMANDA LABORAL completa ante la Cámara del Trabajo de la Provincia de San Luis, conforme al CPL San Luis (Ley I-0783-2004) y la LCT (Ley 20.744).

${MARCO_NORMATIVO}

DATOS DEL CASO:
- Trabajador/Cliente: ${caso.client_name || "—"}
- Empleador/Demandado: ${caso.partes || "[COMPLETAR: empleador]"}
- Jurisdicción: Cámara del Trabajo de San Luis
- Hechos: ${caso.hechos_resumen || caso.descripcion || "—"}
${extra ? `\nConcepto reclamado y liquidación: ${extra}` : ""}

ESTRUCTURA REQUERIDA:
1. Encabezado (Excma. Cámara del Trabajo)
2. I. DATOS DE LAS PARTES
3. II. OBJETO (conceptos reclamados y montos estimados)
4. III. HECHOS (relación laboral, antigüedad, despido, hechos relevantes)
5. IV. LIQUIDACIÓN (indemnización art. 245 LCT, preaviso, vacaciones, SAC, etc.)
6. V. DERECHO (LCT, CPL San Luis, art. 14 bis CN)
7. VI. PRUEBA
8. VII. PETITORIO
9. Firma

Usá lenguaje forense formal. Completá con [COMPLETAR] los datos faltantes.`,
  },
];

export default function ModelosEscritos({ caso, documentos }) {
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [instrucciones, setInstrucciones] = useState("");
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const generarEscrito = async () => {
    if (!modeloSeleccionado) return;
    setLoading(true);
    setResultado(null);

    // Enriquecer con documentos si hay
    const docsTexto = documentos.length > 0
      ? "\n\nDOCUMENTOS DEL CASO DISPONIBLES:\n" +
        documentos.map(d => `- ${d.titulo}${d.contenido_texto ? `: ${d.contenido_texto.slice(0, 500)}...` : ""}`).join("\n")
      : "";

    const modelo = modelos.find(m => m.id === modeloSeleccionado);
    const prompt = modelo.prompt(caso, instrucciones) + docsTexto;

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
    const modelo = modelos.find(m => m.id === modeloSeleccionado);
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

  return (
    <div className="space-y-6">
      {/* Selector de modelo */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Seleccioná el tipo de escrito
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {modelos.map((m) => (
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
          <Button
            onClick={generarEscrito}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Generando escrito..." : `Generar ${modelos.find(m => m.id === modeloSeleccionado)?.label}`}
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
                <span className="text-sm font-semibold">
                  {modelos.find(m => m.id === modeloSeleccionado)?.label}
                </span>
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