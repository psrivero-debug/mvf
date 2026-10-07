import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { subirArchivoPrivado, urlFirmada } from "@/lib/privateFiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Mic, MicOff, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function IusAgentChat({ onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "¡Hola! Soy tu asistente IUS. Puedo ayudarte a gestionar tarifas, eventos, consultas y más. ¿Qué necesitás?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Inicializar conversación
  useEffect(() => {
    const initConversation = async () => {
      const conv = await base44.agents.createConversation({
        agent_name: "IusAssistant",
        metadata: { name: "Sesión IUS", description: "Chat con asistente IUS" }
      });
      setConversation(conv);

      // Suscribirse a actualizaciones
      const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages || []);
      });

      return unsubscribe;
    };

    const unsub = initConversation();
    return () => unsub?.then(fn => fn?.());
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || !conversation || loading) return;

    setInput("");
    setLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: text
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "audio.webm", { type: "audio/webm" });
        
        try {
          const uri = await subirArchivoPrivado(file);
          const url = await urlFirmada(uri);
          const transcript = await base44.integrations.Core.TranscribeAudio({ audio_url: url });
          
          if (transcript) {
            setInput(transcript);
            handleSendMessage(transcript);
          }
        } catch (error) {
          console.error("Error transcribing audio:", error);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-border flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 rounded-t-2xl flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Asistente IUS</h3>
          <p className="text-xs opacity-90">Voz o texto</p>
        </div>
        <Button size="sm" variant="ghost" className="text-primary-foreground hover:bg-white/20 h-8 w-8 p-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-white border border-border text-foreground"
            }`}>
              <ReactMarkdown className="text-sm prose prose-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-border rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 bg-background space-y-2 rounded-b-2xl">
        <div className="flex gap-2">
          <Input
            placeholder="Escribe tu pregunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                handleSendMessage(input);
              }
            }}
            disabled={loading || recording}
            className="text-sm h-9"
          />
          <Button
            size="sm"
            onClick={() => handleSendMessage(input)}
            disabled={loading || !input.trim() || recording}
            className="h-9 w-9 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant={recording ? "destructive" : "outline"}
          size="sm"
          className="w-full gap-2 h-8"
          onClick={recording ? stopRecording : startRecording}
          disabled={loading}
        >
          {recording ? (
            <>
              <MicOff className="w-3.5 h-3.5" /> Detener
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" /> Voz
            </>
          )}
        </Button>
      </div>
    </div>
  );
}