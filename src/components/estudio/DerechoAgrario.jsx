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
  Send, Loader2, Wheat, FileText, AlertCircle, Plus, Trash2,
  ChevronDown, ChevronUp, MapPin, DollarSign, Calculator, RefreshCw
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const MODELOS_ESCRITOS = [
  { id: "contrato_arrendamiento", label: "Contrato de Arrendamiento Rural" },
  { id: "contrato_aparceria", label: "Contrato de Aparcería Ganadera" },
  { id: "contrato_pastaje", label: "Contrato de Pastaje / Pastoreo" },
  { id: "liquidacion_hacienda", label: "Liquidación de Hacienda (Inventario Valuado)" },
  { id: "demanda_desalojo_rural", label: "Demanda de Desalojo Rural" },
  { id: "acta_constatacion", label: "Acta de Constatación de Campo" },
  { id: "denuncia_abigeato", label: "Denuncia por Abigeato" },
  { id: "intimacion_entrega_campo", label: "Intimación de Entrega de Campo" },
  { id: "particion_hacienda", label: "Acuerdo de Partición de Hacienda" },
  { id: "informe_pericial_rural", label: "Informe Pericial Rural" },
];

const CATEGORIAS_BOVINOS = [
  { id: "ternero_destete", label: "Ternero/a de destete (hasta 180kg)" },
  { id: "novillo_160_230", label: "Novillo 160-230kg" },
  { id: "novillo_230_300", label: "Novillo 230-300kg" },
  { id: "novillo_300_mas", label: "Novillo +300kg (gordo)" },
  { id: "vaquillona_160_230", label: "Vaquillona 160-230kg" },
  { id: "vaquillona_230_mas", label: "Vaquillona +230kg" },
  { id: "vaca_invernada", label: "Vaca de invernada" },
  { id: "vaca_vientre", label: "Vaca de vientre (con o sin cría)" },
  { id: "toro", label: "Toro" },
];

const OTRAS_ESPECIES = [
  { id: "ovino_cordero", label: "Ovino - Cordero" },
  { id: "ovino_adulto", label: "Ovino - Adulto" },
  { id: "caprino_cabrito", label: "Caprino - Cabrito" },
  { id: "caprino_adulto", label: "Caprino - Adulto" },
  { id: "equino_trabajo", label: "Equino de trabajo" },
  { id: "porcino", label: "Porcino" },
];

function DatosPredioPanel({ datos, onChange }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="border border-border shadow-none">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
        onClick={() => setExpanded(v => !v)}
      >
        <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Datos del Establecimiento</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nombre del establecimiento</Label>
              <Input className="text-xs mt-1" placeholder='Estancia "La Esperanza"' value={datos.nombre || ""} onChange={e => onChange({ ...datos, nombre: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Propietario / Cliente</Label>
              <Input className="text-xs mt-1" placeholder="Juan Pérez" value={datos.propietario || ""} onChange={e => onChange({ ...datos, propietario: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Departamento (San Luis)</Label>
              <Select value={datos.departamento || ""} onValueChange={v => onChange({ ...datos, departamento: v })}>
                <SelectTrigger className="text-xs mt-1 h-8"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {["General Pedernera", "Coronel Pringles", "Chacabuco", "Ayacucho", "Junín", "Belgrano", "San Martín", "La Capital"].map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Superficie (hectáreas)</Label>
              <Input type="number" className="text-xs mt-1" placeholder="500" value={datos.superficie || ""} onChange={e => onChange({ ...datos, superficie: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Tipo de explotación</Label>
              <Select value={datos.tipo_explotacion || ""} onValueChange={v => onChange({ ...datos, tipo_explotacion: v })}>
                <SelectTrigger className="text-xs mt-1 h-8"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ganadera_bovina">Ganadera bovina</SelectItem>
                  <SelectItem value="ganadera_ovina">Ganadera ovina/caprina</SelectItem>
                  <SelectItem value="agricola">Agrícola (cultivos)</SelectItem>
                  <SelectItem value="mixta">Mixta (ganadería + agricultura)</SelectItem>
                  <SelectItem value="equina">Cabaña / equinos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Descripción del conflicto / asunto</Label>
              <Textarea rows={2} className="text-xs mt-1 resize-none" placeholder="Ej: Incumplimiento de contrato de arrendamiento, falta de pago de cánones..." value={datos.asunto || ""} onChange={e => onChange({ ...datos, asunto: e.target.value })} />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function LiquidacionHaciendaPanel({ hacienda, onChange }) {
  const [expanded, setExpanded] = useState(false);

  const agregarItem = () => {
    onChange([...hacienda, { especie: "bovino", categoria: "", cantidad: "", peso_promedio: "", precio_unitario: "" }]);
  };

  const total = hacienda.reduce((acc, item) => {
    const cant = parseFloat(item.cantidad) || 0;
    const precio = parseFloat(item.precio_unitario) || 0;
    return acc + cant * precio;
  }, 0);

  return (
    <Card className="border border-border shadow-none">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
        onClick={() => setExpanded(v => !v)}
      >
        <span className="flex items-center gap-2"><Calculator className="w-4 h-4 text-accent" /> Inventario de Hacienda</span>
        <span className="flex items-center gap-2">
          {total > 0 && <span className="text-xs font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded">${total.toLocaleString("es-AR")}</span>}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {expanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-3">
          <p className="text-xs text-muted-foreground">Ingresá el inventario. Para liquidaciones precisas, indicá la categoría y la IA calculará con precios de referencia Liniers/ROSGAN actualizados.</p>
          {hacienda.map((item, i) => (
            <div key={i} className="space-y-2 p-3 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Especie</Label>
                  <Select value={item.especie} onValueChange={v => { const a = [...hacienda]; a[i] = { ...a[i], especie: v, categoria: "" }; onChange(a); }}>
                    <SelectTrigger className="text-xs mt-1 h-7"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bovino">Bovino</SelectItem>
                      <SelectItem value="ovino">Ovino</SelectItem>
                      <SelectItem value="caprino">Caprino</SelectItem>
                      <SelectItem value="equino">Equino</SelectItem>
                      <SelectItem value="porcino">Porcino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Categoría</Label>
                  <Select value={item.categoria} onValueChange={v => { const a = [...hacienda]; a[i] = { ...a[i], categoria: v }; onChange(a); }}>
                    <SelectTrigger className="text-xs mt-1 h-7"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {(item.especie === "bovino" ? CATEGORIAS_BOVINOS : OTRAS_ESPECIES.filter(x => x.id.startsWith(item.especie))).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Cantidad (cabezas)</Label>
                  <Input type="number" className="text-xs mt-1 h-7" placeholder="0" value={item.cantidad} onChange={e => { const a = [...hacienda]; a[i] = { ...a[i], cantidad: e.target.value }; onChange(a); }} />
                </div>
                <div>
                  <Label className="text-xs">Peso prom. (kg)</Label>
                  <Input type="number" className="text-xs mt-1 h-7" placeholder="Opcional" value={item.peso_promedio} onChange={e => { const a = [...hacienda]; a[i] = { ...a[i], peso_promedio: e.target.value }; onChange(a); }} />
                </div>
                <div>
                  <Label className="text-xs">Precio unit. ($)</Label>
                  <Input type="number" className="text-xs mt-1 h-7" placeholder="Dejar en 0 para que calcule la IA" value={item.precio_unitario} onChange={e => { const a = [...hacienda]; a[i] = { ...a[i], precio_unitario: e.target.value }; onChange(a); }} />
                </div>
                <div className="flex items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Subtotal</Label>
                    <p className="text-xs font-mono mt-1 h-7 flex items-center text-green-700">
                      ${((parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0)).toLocaleString("es-AR")}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive mb-0.5" onClick={() => onChange(hacienda.filter((_, j) => j !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full gap-1 text-xs h-7" onClick={agregarItem}>
            <Plus className="w-3 h-3" /> Agregar especie/categoría
          </Button>
          {total > 0 && (
            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg border border-green-200">
              <span className="text-xs font-semibold text-green-800">Total estimado hacienda:</span>
              <span className="text-sm font-bold text-green-700">${total.toLocaleString("es-AR")}</span>
            </div>
          )}
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
        <div className="h-7 w-7 rounded-lg bg-green-700 flex items-center justify-center mt-0.5 shrink-0">
          <Wheat className="w-3.5 h-3.5 text-white" />
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

export default function DerechoAgrario({ caso }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [modeloSeleccionado, setModeloSeleccionado] = useState("");
  const [datosPredio, setDatosPredio] = useState({ departamento: "", tipo_explotacion: "" });
  const [hacienda, setHacienda] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    let unsub;
    const init = async () => {
      const conv = await base44.agents.createConversation({
        agent_name: "DerechoAgrario",
        metadata: { caso_id: caso?.id, caso_titulo: caso?.titulo }
      });
      setConversation(conv);
      unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages || []);
      });
    };
    init();
    return () => { if (unsub) unsub(); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContexto = () => {
    const lines = [];
    if (caso?.titulo) lines.push(`**Caso:** ${caso.titulo}`);
    if (caso?.numero_expediente) lines.push(`**Expediente:** ${caso.numero_expediente}`);
    if (caso?.client_name) lines.push(`**Cliente:** ${caso.client_name}`);
    if (datosPredio.nombre) lines.push(`**Establecimiento:** ${datosPredio.nombre}`);
    if (datosPredio.propietario) lines.push(`**Propietario:** ${datosPredio.propietario}`);
    if (datosPredio.departamento) lines.push(`**Departamento San Luis:** ${datosPredio.departamento}`);
    if (datosPredio.superficie) lines.push(`**Superficie:** ${datosPredio.superficie} ha`);
    if (datosPredio.tipo_explotacion) lines.push(`**Explotación:** ${datosPredio.tipo_explotacion}`);
    if (datosPredio.asunto) lines.push(`**Asunto:** ${datosPredio.asunto}`);
    if (hacienda.length > 0) {
      lines.push("\n**INVENTARIO DE HACIENDA:**");
      hacienda.forEach(item => {
        const catLabel = [...CATEGORIAS_BOVINOS, ...OTRAS_ESPECIES].find(c => c.id === item.categoria)?.label || item.categoria;
        const sub = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0);
        lines.push(`  - ${item.especie} - ${catLabel}: ${item.cantidad} cabezas${item.peso_promedio ? `, ${item.peso_promedio}kg prom.` : ""}${item.precio_unitario ? `, $${Number(item.precio_unitario).toLocaleString("es-AR")}/cab., subtotal $${sub.toLocaleString("es-AR")}` : " (precio a cotizar)"}`);
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
    const prompt = `Redactá un **${modelo.label}** completo y formal, conforme la normativa agraria argentina vigente al 2025, con énfasis en la legislación de la **Provincia de San Luis** (Código Rural provincial, Ley I-0081-2004, Ley 13.246 y demás normas aplicables).\n\n${contexto ? `**DATOS DEL CASO Y ESTABLECIMIENTO:**\n${contexto}\n\n` : ""}${modeloSeleccionado === "liquidacion_hacienda" ? "Para la liquidación, usá valores de referencia actualizados del Mercado de Liniers y ROSGAN, indicando fecha de cotización y categorías con precio por cabeza y total. Si hay precios cargados en el inventario, usalos; de lo contrario estimá según categoría y condiciones de mercado actuales.\n\n" : ""}Incluí: encabezado con datos de las partes y tribunal si corresponde, objeto, hechos, fundamentos de derecho citando artículos específicos de la normativa nacional y provincial de San Luis, petitorio detallado y cierre profesional. Escrito completo, no un esquema.`;
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
      {/* Panel izquierdo */}
      <div className="xl:col-span-1 overflow-y-auto space-y-4 pr-1">
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <Wheat className="w-5 h-5 text-green-700" />
            <h3 className="font-semibold">Derecho Agrario</h3>
            <Badge className="bg-green-100 text-green-800 text-xs">Especialista IA - San Luis</Badge>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => { setDatosPredio({ departamento: "", tipo_explotacion: "" }); setHacienda([]); setModeloSeleccionado(""); }}
            title="Limpiar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <DatosPredioPanel datos={datosPredio} onChange={setDatosPredio} />
        <LiquidacionHaciendaPanel hacienda={hacienda} onChange={setHacienda} />

        {/* Generar escrito */}
        <Card className="border border-border shadow-none">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent" /> Generar Documento / Escrito
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
              className="w-full gap-2 text-xs bg-green-700 hover:bg-green-800"
              size="sm"
              disabled={!modeloSeleccionado || sending || !conversation}
              onClick={handleGenerarEscrito}
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Generar documento
            </Button>
          </CardContent>
        </Card>

        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800 flex gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Normativa agraria nacional y Código Rural San Luis vigentes al 2025. Precios de hacienda referenciados en Liniers/ROSGAN.</span>
        </div>
      </div>

      {/* Chat */}
      <div className="xl:col-span-2 flex flex-col bg-muted/20 rounded-xl border overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                <Wheat className="w-7 h-7 text-green-700" />
              </div>
              <p className="font-semibold">Especialista en Derecho Agrario - San Luis</p>
              <p className="text-sm text-muted-foreground">
                Completá los datos del establecimiento y el inventario de hacienda. Puedo analizar contratos rurales, realizar liquidaciones ganaderas con precios actualizados, y redactar escritos bajo la normativa de San Luis.
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-2">
                {[
                  "Realizá una liquidación del inventario de hacienda cargado",
                  "¿Cuáles son los requisitos para un contrato de arrendamiento rural en San Luis?",
                  "¿Cómo se calcula el canon de arrendamiento según la productividad?",
                  "Analizá el caso y sugerí la estrategia legal más conveniente",
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
            placeholder="Consultá sobre derecho agrario, liquidaciones de hacienda, contratos rurales..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending || !conversation}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sending || !conversation}
            className="h-full px-3 bg-green-700 hover:bg-green-800"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}