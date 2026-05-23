import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Send, Loader2, Scale, FileText, AlertCircle, Plus, Trash2,
  ChevronDown, ChevronUp, Building2, DollarSign, Users, Gavel
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const MODELOS_ESCRITOS = [
  { id: "concurso_preventivo", label: "Pedido de Concurso Preventivo" },
  { id: "quiebra_voluntaria", label: "Presentación en Quiebra Voluntaria" },
  { id: "verificacion_credito", label: "Verificación de Crédito" },
  { id: "impugnacion_credito", label: "Impugnación de Crédito Verificado" },
  { id: "APE", label: "Acuerdo Preventivo Extrajudicial (APE)" },
  { id: "propuesta_acuerdo", label: "Propuesta de Acuerdo Preventivo" },
  { id: "informe_sindico", label: "Informe General del Síndico" },
  { id: "continuacion_explotacion", label: "Pedido de Continuación de Explotación" },
  { id: "salvataje", label: "Pedido de Salvataje (Cramdown)" },
];

function DatosDeudorPanel({ datos, onChange }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="border border-border shadow-none">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
        onClick={() => setExpanded(v => !v)}
      >
        <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-accent" /> Datos del Deudor</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nombre / Razón Social</Label>
              <Input
                className="text-xs mt-1"
                placeholder="Juan Pérez / Empresa S.A."
                value={datos.nombre || ""}
                onChange={e => onChange({ ...datos, nombre: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">CUIT</Label>
              <Input
                className="text-xs mt-1"
                placeholder="20-12345678-9"
                value={datos.cuit || ""}
                onChange={e => onChange({ ...datos, cuit: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Domicilio</Label>
              <Input
                className="text-xs mt-1"
                placeholder="Av. Libertad 123, San Luis"
                value={datos.domicilio || ""}
                onChange={e => onChange({ ...datos, domicilio: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Actividad</Label>
              <Input
                className="text-xs mt-1"
                placeholder="Comercio minorista, construcción, etc."
                value={datos.actividad || ""}
                onChange={e => onChange({ ...datos, actividad: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Jurisdicción</Label>
              <Select
                value={datos.jurisdiccion || "san_luis"}
                onValueChange={v => onChange({ ...datos, jurisdiccion: v })}
              >
                <SelectTrigger className="text-xs mt-1 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="san_luis">San Luis</SelectItem>
                  <SelectItem value="cordoba">Córdoba</SelectItem>
                  <SelectItem value="nacional">Nacional (Capital Federal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo de deudor</Label>
              <Select
                value={datos.tipo || "persona_fisica"}
                onValueChange={v => onChange({ ...datos, tipo: v })}
              >
                <SelectTrigger className="text-xs mt-1 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="persona_fisica">Persona Física</SelectItem>
                  <SelectItem value="sociedad">Sociedad</SelectItem>
                  <SelectItem value="comerciante">Comerciante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Situación Patrimonial</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Activo total estimado</Label>
                <Input
                  type="number"
                  className="text-xs mt-1"
                  placeholder="0.00"
                  value={datos.activo || ""}
                  onChange={e => onChange({ ...datos, activo: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Pasivo total estimado</Label>
                <Input
                  type="number"
                  className="text-xs mt-1"
                  placeholder="0.00"
                  value={datos.pasivo || ""}
                  onChange={e => onChange({ ...datos, pasivo: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Descripción de la situación de insolvencia</Label>
              <Textarea
                rows={2}
                className="text-xs mt-1 resize-none"
                placeholder="Ej: Cesación de pagos desde hace 6 meses, deudas vencidas con proveedores..."
                value={datos.situacion || ""}
                onChange={e => onChange({ ...datos, situacion: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Acreedores Principales</p>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs gap-1"
                onClick={() => onChange({ ...datos, acreedores: [...(datos.acreedores || []), { nombre: "", monto: "", tipo: "quirografario" }] })}
              >
                <Plus className="w-3 h-3" /> Agregar
              </Button>
            </div>
            {(datos.acreedores || []).map((ac, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  className="text-xs col-span-4"
                  placeholder="Nombre acreedor"
                  value={ac.nombre}
                  onChange={e => {
                    const a = [...datos.acreedores]; a[i] = { ...a[i], nombre: e.target.value };
                    onChange({ ...datos, acreedores: a });
                  }}
                />
                <Input
                  className="text-xs col-span-3"
                  placeholder="Monto $"
                  value={ac.monto}
                  onChange={e => {
                    const a = [...datos.acreedores]; a[i] = { ...a[i], monto: e.target.value };
                    onChange({ ...datos, acreedores: a });
                  }}
                />
                <Select
                  value={ac.tipo}
                  onValueChange={v => {
                    const a = [...datos.acreedores]; a[i] = { ...a[i], tipo: v };
                    onChange({ ...datos, acreedores: a });
                  }}
                >
                  <SelectTrigger className="text-xs col-span-4 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quirografario">Quirografario</SelectItem>
                    <SelectItem value="privilegiado_especial">Priv. Especial</SelectItem>
                    <SelectItem value="privilegiado_general">Priv. General</SelectItem>
                    <SelectItem value="laboral">Laboral</SelectItem>
                    <SelectItem value="fiscal">Fiscal</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  className="col-span-1 h-7 w-7 text-destructive"
                  onClick={() => {
                    const a = datos.acreedores.filter((_, j) => j !== i);
                    onChange({ ...datos, acreedores: a });
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center mt-0.5 shrink-0">
          <Scale className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "flex flex-col items-end" : ""}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-2.5 ${isUser ? "bg-primary text-primary-foreground" : "bg-white border border-border"}`}>
            {isUser ? (
              <p className="text-sm">{message.content}</p>
            ) : (
              <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConcursoQuiebra({ caso }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [modeloSeleccionado, setModeloSeleccionado] = useState("");
  const [datosDeudor, setDatosDeudor] = useState({ jurisdiccion: "san_luis", tipo: "persona_fisica", acreedores: [] });
  const bottomRef = useRef(null);

  useEffect(() => {
    iniciarConversacion();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const iniciarConversacion = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "ConcursoQuiebra",
      metadata: { caso_id: caso?.id, caso_titulo: caso?.titulo }
    });
    setConversation(conv);

    const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages(data.messages || []);
    });

    return unsubscribe;
  };

  const buildContexto = () => {
    const lines = [];
    if (caso?.titulo) lines.push(`**Caso:** ${caso.titulo}`);
    if (caso?.numero_expediente) lines.push(`**Expediente:** ${caso.numero_expediente}`);
    if (datosDeudor.nombre) lines.push(`**Deudor:** ${datosDeudor.nombre}`);
    if (datosDeudor.cuit) lines.push(`**CUIT:** ${datosDeudor.cuit}`);
    if (datosDeudor.domicilio) lines.push(`**Domicilio:** ${datosDeudor.domicilio}`);
    if (datosDeudor.actividad) lines.push(`**Actividad:** ${datosDeudor.actividad}`);
    if (datosDeudor.jurisdiccion) lines.push(`**Jurisdicción:** ${datosDeudor.jurisdiccion === "san_luis" ? "San Luis" : datosDeudor.jurisdiccion === "cordoba" ? "Córdoba" : "Nacional"}`);
    if (datosDeudor.tipo) lines.push(`**Tipo:** ${datosDeudor.tipo}`);
    if (datosDeudor.activo) lines.push(`**Activo:** $${Number(datosDeudor.activo).toLocaleString("es-AR")}`);
    if (datosDeudor.pasivo) lines.push(`**Pasivo:** $${Number(datosDeudor.pasivo).toLocaleString("es-AR")}`);
    if (datosDeudor.situacion) lines.push(`**Situación:** ${datosDeudor.situacion}`);
    if ((datosDeudor.acreedores || []).length > 0) {
      lines.push("**Acreedores:**");
      datosDeudor.acreedores.forEach(a => {
        if (a.nombre) lines.push(`  - ${a.nombre}: $${a.monto} (${a.tipo})`);
      });
    }
    return lines.join("\n");
  };

  const handleSend = async () => {
    if (!input.trim() || !conversation) return;
    setSending(true);
    const msg = input.trim();
    setInput("");
    await base44.agents.addMessage(conversation, { role: "user", content: msg });
    setSending(false);
  };

  const handleGenerarEscrito = async () => {
    if (!modeloSeleccionado || !conversation) return;
    const modelo = MODELOS_ESCRITOS.find(m => m.id === modeloSeleccionado);
    const contexto = buildContexto();
    setSending(true);
    setInput("");
    const prompt = `Redactá un **${modelo.label}** completo y formal, listo para presentar ante el juzgado.\n\n${contexto ? `**DATOS DEL CASO:**\n${contexto}\n\n` : ""}Incluí: encabezado con datos del tribunal, objeto, hechos, fundamentos de derecho citando artículos específicos de la LCQ y normativa aplicable en ${datosDeudor.jurisdiccion === "cordoba" ? "Córdoba" : "San Luis"}, petitorio detallado y cierre profesional. Que sea un escrito completo, no un esquema.`;
    await base44.agents.addMessage(conversation, { role: "user", content: prompt });
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 h-[calc(100vh-280px)] min-h-[500px]">
      {/* Panel izquierdo: datos */}
      <div className="xl:col-span-1 overflow-y-auto space-y-4 pr-1">
        <div className="flex items-center gap-2 pb-2">
          <Gavel className="w-5 h-5 text-accent" />
          <h3 className="font-semibold">Concurso y Quiebra</h3>
          <Badge className="bg-primary/10 text-primary text-xs">Especialista IA</Badge>
        </div>

        <DatosDeudorPanel datos={datosDeudor} onChange={setDatosDeudor} />

        {/* Generar modelo de escrito */}
        <Card className="border border-border shadow-none">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent" /> Generar Escrito Completo
            </p>
            <Select value={modeloSeleccionado} onValueChange={setModeloSeleccionado}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Seleccioná el modelo..." />
              </SelectTrigger>
              <SelectContent>
                {MODELOS_ESCRITOS.map(m => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full gap-2 text-xs"
              size="sm"
              disabled={!modeloSeleccionado || sending || !conversation}
              onClick={handleGenerarEscrito}
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Generar escrito
            </Button>
          </CardContent>
        </Card>

        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Normativa vigente LCQ, CCyCN y pautas de San Luis y Córdoba al 2025.</span>
        </div>
      </div>

      {/* Chat */}
      <div className="xl:col-span-2 flex flex-col bg-muted/20 rounded-xl border overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Scale className="w-7 h-7 text-primary" />
              </div>
              <p className="font-semibold">Especialista en Concursos y Quiebras</p>
              <p className="text-sm text-muted-foreground">
                Cargá los datos del deudor y hacé tu consulta. Puedo analizar la viabilidad del proceso, calcular plazos, estrategia concursal y redactar escritos completos bajo normativa de San Luis y Córdoba.
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-2">
                {[
                  "¿Conviene concurso preventivo o quiebra voluntaria?",
                  "¿Cuáles son los plazos del período de exclusividad?",
                  "Analizá la situación patrimonial cargada",
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-xs text-left px-3 py-2 rounded-lg border bg-white hover:bg-muted/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => <MessageBubble key={i} message={msg} />)
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-3 flex gap-2">
          <Textarea
            rows={2}
            className="text-sm resize-none flex-1"
            placeholder="Consultá sobre el proceso concursal, normativa, plazos o estrategia..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending || !conversation}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sending || !conversation}
            className="h-full px-3"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}