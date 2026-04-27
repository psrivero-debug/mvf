import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Bot, User, Trash2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SYSTEM_PROMPT = (caso) => `Sos un ASESOR LEGAL EXPERTO en derecho argentino, con especialización en la Provincia de San Luis.
Tenés más de 30 años de experiencia en todos los fueros y tipos de procesos: civil, penal, laboral, familia, comercial, administrativo, inmobiliario y constitucional.

CASO EN ANÁLISIS:
- Carátula: ${caso.titulo}
- Cliente: ${caso.client_name || "—"}
- Tipo: ${caso.tipo_caso || "—"}
- Jurisdicción: ${caso.jurisdiccion || "—"}
- Partes: ${caso.partes || "—"}
- Hechos: ${caso.hechos_resumen || caso.descripcion || "—"}
- Expediente: ${caso.numero_expediente || "—"}

MARCO NORMATIVO:
- Código Civil y Comercial de la Nación (CCCN - Ley 26.994)
- Código de Familia de San Luis (Ley I-0007-2004)
- CPCC de San Luis (Ley I-0002-2004)
- CPP de San Luis (Ley II-0009-2005)
- Código Procesal Laboral de San Luis (Ley I-0783-2004)
- Ley de Contrato de Trabajo (Ley 20.744)
- Ley Nacional de Procedimientos Administrativos (Ley 19.549)
- CPCCN (Ley 17.454)
- Constitución Nacional y provincial

TU ROL:
1. Asesorás estratégicamente al abogado sobre el caso
2. Explicás derechos, plazos, recursos y estrategias procesales
3. Citás jurisprudencia relevante de San Luis, Cámaras y CSJN
4. Alertás sobre riesgos procesales, prescripciones y nulidades
5. Sugerís las mejores acciones a tomar en cada etapa del proceso
6. Respondés consultas sobre cualquier aspecto jurídico del caso

Respondé siempre en español, con lenguaje técnico-jurídico claro. Sé directo, preciso y útil.`;

const ACCIONES_RAPIDAS = [
  "¿Cuáles son los plazos procesales críticos en este caso?",
  "¿Qué estrategia recomendás para defender al cliente?",
  "¿Existe riesgo de prescripción? ¿Cuándo vence?",
  "¿Qué pruebas son esenciales para este tipo de proceso?",
  "¿Qué recursos procesales tenemos disponibles?",
  "¿Cuál es la jurisprudencia aplicable en San Luis?",
  "¿Hay posibilidad de medidas cautelares? ¿Cuáles?",
  "¿Cuáles son las fortalezas y debilidades del caso?",
];

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-muted border"
      }`}>
        {isUser ? (
          <p className="leading-relaxed">{msg.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
}

export default function AsesorLegal({ caso }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hola, soy tu **Asesor Legal** especializado en derecho argentino y especialmente en la Provincia de San Luis.\n\nEstoy analizando el caso **"${caso.titulo}"**. ¿En qué aspecto jurídico puedo ayudarte hoy? Podés preguntarme sobre estrategia procesal, plazos, recursos, jurisprudencia o cualquier consulta legal sobre el caso.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (texto) => {
    const userText = texto || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    // Construir historial para el prompt
    const historial = newMessages
      .slice(-10) // últimos 10 mensajes para contexto
      .map(m => `[${m.role === "user" ? "ABOGADO" : "ASESOR"}]: ${m.content}`)
      .join("\n\n");

    const respuesta = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT(caso)}\n\nHISTORIAL DE CONVERSACIÓN:\n${historial}\n\nResponde al último mensaje del ABOGADO de forma experta y directa.`,
      model: "claude_sonnet_4_6",
    });

    setMessages(prev => [...prev, { role: "assistant", content: respuesta }]);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[70vh] min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">Asesor Legal</p>
            <p className="text-xs text-muted-foreground">Especialista en derecho argentino · San Luis</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs text-muted-foreground"
          onClick={() => setMessages([{
            role: "assistant",
            content: `Hola, soy tu **Asesor Legal** especializado en derecho argentino y especialmente en la Provincia de San Luis.\n\nEstoy analizando el caso **"${caso.titulo}"**. ¿En qué aspecto jurídico puedo ayudarte hoy?`,
          }])}
        >
          <Trash2 className="w-3.5 h-3.5" /> Limpiar
        </Button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-muted border rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Analizando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Acciones rápidas */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Consultas frecuentes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ACCIONES_RAPIDAS.map((accion) => (
              <button
                key={accion}
                onClick={() => sendMessage(accion)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-40"
              >
                {accion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t flex gap-3 items-end">
        <Textarea
          placeholder="Consultá sobre estrategia, plazos, recursos, jurisprudencia... (Enter para enviar)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="resize-none flex-1"
          disabled={loading}
        />
        <Button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          size="icon"
          className="shrink-0 h-10 w-10"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}