import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, FileText, AlignLeft, AlignJustify, Maximize2, Copy, Printer, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { GRUPOS_MODELOS } from "@/components/estudio/modelos-escritos-data";

const FORMATS = [
  { id: "compacto", label: "Compacto", icon: AlignLeft, desc: "Borrador rápido · ~400 palabras" },
  { id: "medio", label: "Medio", icon: AlignJustify, desc: "Equilibrado · ~800 palabras" },
  { id: "completo", label: "Completo", icon: Maximize2, desc: "Formal y exhaustivo" },
];

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const [copiado, setCopiado] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #222; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; }
        h1,h2,h3 { color: #1e3a5f; }
        pre { white-space: pre-wrap; }
        .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>
      <div>${message.content.replace(/\n/g, "<br>")}</div>
      <div class="footer">Estudio Jurídico Pérez & Funes · San Luis · Generado por Asistente IA</div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-0.5">
          <FileText className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "flex flex-col items-end" : ""}`}>
        <div className={`rounded-2xl px-4 py-3 ${isUser ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && message.content && (
          <div className="flex gap-1 mt-1.5 pl-1">
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground gap-1" onClick={handleCopy}>
              <Copy className="w-3 h-3" />
              {copiado ? "¡Copiado!" : "Copiar"}
            </Button>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground gap-1" onClick={handlePrint}>
              <Printer className="w-3 h-3" /> Imprimir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EscritorJudicial() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [formato, setFormato] = useState("medio");
  const [modeloRapido, setModeloRapido] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      const conv = await base44.agents.createConversation({
        agent_name: "EscritorJudicial",
        metadata: { name: "Escritos Judiciales" },
      });
      setConversation(conv);
    };
    init();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  const sendMessage = async (text) => {
    if (!text.trim() || !conversation || sending) return;
    setSending(true);
    setInput("");
    await base44.agents.addMessage(conversation, { role: "user", content: text });
    setSending(false);
  };

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleModeloRapido = (modeloId) => {
    if (!modeloId) return;
    const allModelos = GRUPOS_MODELOS.flatMap(g => g.modelos);
    const m = allModelos.find(x => x.id === modeloId);
    if (!m) return;
    const formatLabel = FORMATS.find(f => f.id === formato)?.label || "Medio";
    const texto = `Necesito redactar un escrito de tipo "${m.label}". Usá formato ${formatLabel}. Por favor indicame los datos que necesitás del caso o, si ya tenés suficiente contexto, generalo con los campos [COMPLETAR] donde corresponda.`;
    setModeloRapido("");
    sendMessage(texto);
  };

  const handleSugerencia = (texto) => sendMessage(texto);

  const formatActual = FORMATS.find(f => f.id === formato);
  const FormatIcon = formatActual?.icon || AlignJustify;

  return (
    <div className="flex h-[calc(100vh-80px)] bg-background">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-72 shrink-0 border-r bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Escritos Judiciales IA
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Redacción forense asistida por IA</p>
          </div>

          {/* Formato */}
          <div className="p-4 border-b space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Formato de escrito</p>
            <div className="space-y-1.5">
              {FORMATS.map(f => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormato(f.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all text-sm ${formato === f.id ? "border-primary bg-primary/5 text-primary" : "border-transparent hover:bg-muted text-muted-foreground"}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="font-medium leading-none">{f.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-70">{f.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inicio rápido por tipo */}
          <div className="p-4 flex-1 overflow-y-auto space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inicio rápido por tipo</p>
            <Select value={modeloRapido} onValueChange={v => { setModeloRapido(v); handleModeloRapido(v); }}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Seleccioná un modelo..." />
              </SelectTrigger>
              <SelectContent>
                {GRUPOS_MODELOS.map(g => (
                  <div key={g.label}>
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50">{g.label}</div>
                    {g.modelos.map(m => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">{m.label}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            {/* Sugerencias rápidas */}
            <div className="mt-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sugerencias</p>
              {[
                "Redactá una demanda de alimentos en formato compacto",
                "Necesito un recurso de apelación en formato medio",
                "Generá una medida cautelar de embargo preventivo",
                "Escrito de divorcio unilateral con convenio regulador",
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSugerencia(s)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  → {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>
            <div>
              <h1 className="font-semibold text-sm">Escritor Judicial IA</h1>
              <p className="text-xs text-muted-foreground">Redacción forense · San Luis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary gap-1 text-xs">
              <FormatIcon className="w-3 h-3" /> {formatActual?.label}
            </Badge>
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground mb-1">Escritor Judicial IA</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Redacto escritos judiciales formales en formato <strong>compacto</strong>, <strong>medio</strong> o <strong>completo</strong>. Contame qué necesitás.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["Demanda de alimentos", "Recurso de apelación", "Medida cautelar", "Divorcio unilateral"].map(s => (
                  <button
                    key={s}
                    onClick={() => handleSugerencia(`Necesito un escrito de "${s}" en formato ${formato}`)}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.filter(m => m.role !== "system").map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {sending && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-card border rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-card px-4 py-3">
          <div className="flex gap-2 items-end">
            <textarea
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              rows={2}
              placeholder={`Describí el escrito que necesitás (formato ${formatActual?.label} activo)...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleSend} disabled={!input.trim() || sending || !conversation} className="gap-2 shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 pl-1">Enter para enviar · Los campos [COMPLETAR] deben completarse antes de presentar el escrito</p>
        </div>
      </div>
    </div>
  );
}