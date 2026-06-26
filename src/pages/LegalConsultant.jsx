import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { invokeLLM, invokeAllWithLocal } from "@/lib/llm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Scale, Send, Loader2, BookOpen, Trash2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function LegalConsultant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [localProgress, setLocalProgress] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const conversationHistory = [...messages, userMsg]
      .map(m => `${m.role === "user" ? "USUARIO" : "ASISTENTE"}: ${m.content}`)
      .join("\n\n");

    const prompt = `Eres un asistente jurídico experto en derecho argentino. Tu función es asistir a abogados de un estudio jurídico en consultas legales.

CONTEXTO IMPORTANTE:
- Toda la información es CONFIDENCIAL y para uso exclusivo del estudio
- Debes referenciar legislación vigente argentina: Constitución Nacional, Código Civil y Comercial, Código Penal, leyes especiales, ordenanzas, decretos
- Cita artículos específicos cuando corresponda
- Indica jurisprudencia relevante cuando sea posible
- Si no estás seguro de algo, indícalo claramente

HISTORIAL DE CONVERSACIÓN:
${conversationHistory}

Responde la última consulta del usuario de forma precisa, profesional y fundamentada en derecho argentino. Usa formato Markdown para mejor legibilidad.`;

    if (compareMode) {
      setLocalProgress("Iniciando IA local...");
      const { base44: b44, gemini: gem, deepseek: ds, local } = await invokeAllWithLocal({
        prompt,
        add_context_from_internet: true,
      }, (p, text) => setLocalProgress(text || `${Math.round(p * 100)}%`));
      setMessages(prev => [...prev, { role: "assistant", base44: b44, gemini: gem, deepseek: ds, local }]);
    } else {
      const result = await invokeLLM({
        prompt,
        add_context_from_internet: true,
      });
      setMessages(prev => [...prev, { role: "assistant", content: result }]);
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQueries = [
    "¿Cuáles son los plazos para interponer un recurso de apelación en materia civil?",
    "¿Qué establece el Art. 14 bis de la Constitución Nacional?",
    "Requisitos para una carta documento válida",
    "Procedimiento de mediación obligatoria en CABA",
  ];

  return (
    <div className="p-6 lg:p-8 h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl lg:text-3xl font-serif font-bold">Consulta Legal IA</h1>
        <p className="text-muted-foreground mt-1">Asistente jurídico con referencia a legislación vigente argentina</p>
      </div>

      <Card className="border-0 shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="w-4 h-4 text-accent" />
              Asistente Jurídico
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1">
                <BookOpen className="w-3 h-3" />
                Legislación AR
              </Badge>
              <Button
                variant={compareMode ? "default" : "outline"}
                size="sm"
                onClick={() => setCompareMode(c => !c)}
                className="text-xs gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {compareMode ? "Comparando" : "Comparar IA"}
              </Button>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-xs gap-1">
                  <Trash2 className="w-3 h-3" /> Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Scale className="w-16 h-16 text-muted-foreground/20" />
              <p className="text-lg font-serif font-semibold mt-4">Consulta Legal Confidencial</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Realiza consultas sobre legislación argentina, jurisprudencia, plazos procesales y más. Toda la información es privada.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-lg">
                {quickQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-left text-xs p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                if (msg.role === "assistant" && msg.base44 !== undefined) {
                  return (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <div className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Base44
                        </div>
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{msg.base44 || "*Sin respuesta — créditos agotados.*"}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-600 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Gemini
                        </div>
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{msg.gemini || "*Sin respuesta.*"}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-purple-600 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> DeepSeek
                        </div>
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{msg.deepseek || "*Sin respuesta — sin saldo en la cuenta.*"}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-amber-600 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Local (WebLLM)
                        </div>
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{msg.local || "*Sin respuesta — WebGPU no disponible.*"}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    }`}>
                      {msg.role === "user" ? (
                        <p className="text-sm">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {compareMode && localProgress ? `IA local: ${localProgress}` : "Analizando consulta..."}
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </>
          )}
        </CardContent>

        <div className="p-4 border-t shrink-0">
          <div className="flex gap-2">
            <Textarea
              placeholder="Escribe tu consulta legal..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="resize-none"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="icon" className="shrink-0 h-auto">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Las respuestas son orientativas. Verifique siempre con la legislación vigente.
          </p>
        </div>
      </Card>
    </div>
  );
}