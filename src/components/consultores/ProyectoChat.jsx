import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { invokeLLM } from "@/lib/llm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Send, Loader2, MessagesSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

// Si contenido_texto quedó guardado como URL (texto largo), resuelve el contenido real
async function resolverTexto(t) {
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try { return await fetch(t).then(r => r.text()); } catch { return t; }
  }
  return t;
}

export default function ProyectoChat({ consultor, proyecto, documentos }) {
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ultimoMensaje, setUltimoMensaje] = useState(null);
  const endRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: analisis = [] } = useQuery({
    queryKey: ["proyecto_analisis", proyecto.id],
    queryFn: () => base44.entities.ProyectoAnalisis.filter({ proyecto_id: proyecto.id }, "created_date"),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [analisis.length, enviando]);

  const construirContexto = async () => {
    const conTexto = documentos.filter(d => d.contenido_texto);
    if (!conTexto.length) return "";
    const partes = await Promise.all(
      conTexto.map(async d => `--- DOCUMENTO: "${d.titulo}" ---\n${(await resolverTexto(d.contenido_texto)).slice(0, 8000)}`)
    );
    return partes.join("\n\n");
  };

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || enviando) return;
    setInput("");
    setUltimoMensaje(texto);
    setEnviando(true);
    try {
      const docsTexto = await construirContexto();
      const prompt = `${consultor.prompt}\n\n${docsTexto ? `DOCUMENTOS DEL PROYECTO:\n${docsTexto}\n\n` : ""}Consulta del usuario:\n${texto}`;
      const res = await invokeLLM({ prompt, add_context_from_internet: true });
      await base44.entities.ProyectoAnalisis.create({
        proyecto_id: proyecto.id,
        consulta: texto,
        respuesta: res,
      });
      queryClient.invalidateQueries({ queryKey: ["proyecto_analisis", proyecto.id] });
      setUltimoMensaje(null);
    } catch (e) {
      setUltimoMensaje(null);
      toast({ title: "Error", description: "No se pudo procesar la consulta. Intentá nuevamente.", variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-320px)] mt-4">
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {analisis.length === 0 && !enviando && (
          <div className="text-center py-10 text-sm text-muted-foreground">
            <MessagesSquare className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
            Escribí tu primera consulta. El consultor analizará los documentos cargados en el proyecto.
          </div>
        )}
        {analisis.map((a) => (
          <div key={a.id}>
            <div className="flex justify-end mb-2">
              <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 max-w-[85%]">
                <p className="text-sm whitespace-pre-wrap">{a.consulta}</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3 max-w-[85%]">
                <div className="prose prose-sm max-w-none"><ReactMarkdown>{a.respuesta}</ReactMarkdown></div>
              </div>
            </div>
          </div>
        ))}
        {enviando && (
          <>
            <div className="flex justify-end mb-2">
              <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 max-w-[85%]">
                <p className="text-sm whitespace-pre-wrap">{ultimoMensaje}</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizando consulta con los documentos del proyecto...
                </div>
              </div>
            </div>
          </>
        )}
        <div ref={endRef} />
      </CardContent>
      <div className="border-t p-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder="Escribí tu consulta sobre este proyecto..."
          className="min-h-[44px] max-h-32 resize-none"
        />
        <Button onClick={enviar} disabled={enviando || !input.trim()} size="icon" className="h-auto shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}