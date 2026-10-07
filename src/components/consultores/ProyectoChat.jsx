import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { invokeLLM } from "@/lib/llm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Send, Loader2, MessagesSquare, Search, Swords, Gavel, Lightbulb, FilePenLine, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { resolverTextoRef as resolverTexto } from "@/lib/privateFiles";
import { descargarWord } from "@/lib/docxExport";
import DictadoVoz from "@/components/DictadoVoz";

const ACCIONES = [
  { tipo: "indagacion", label: "Indagar más", icon: Search },
  { tipo: "contraparte", label: "Contraparte", icon: Swords },
  { tipo: "juez", label: "Juez", icon: Gavel },
  { tipo: "fichas", label: "Fichas de ideas", icon: Lightbulb },
  { tipo: "escrito", label: "Redactar escrito", icon: FilePenLine },
];

const ETIQUETAS = {
  indagacion: { label: "Indagación", color: "bg-blue-100 text-blue-700" },
  contraparte: { label: "Contraparte", color: "bg-red-100 text-red-700" },
  juez: { label: "Punto de vista del juez", color: "bg-purple-100 text-purple-700" },
  ficha: { label: "Ficha de idea", color: "bg-amber-100 text-amber-700" },
  escrito: { label: "Escrito", color: "bg-green-100 text-green-700" },
};

export default function ProyectoChat({ consultor, proyecto, documentos }) {
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ejecutando, setEjecutando] = useState(null);
  const [ultimoMensaje, setUltimoMensaje] = useState(null);
  const endRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: analisis = [] } = useQuery({
    queryKey: ["proyecto_analisis", proyecto.id],
    queryFn: () => base44.entities.ProyectoAnalisis.filter({ proyecto_id: proyecto.id }, "created_date"),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [analisis.length, enviando, ejecutando]);

  const construirContexto = async () => {
    const conTexto = documentos.filter(d => d.contenido_texto);
    if (!conTexto.length) return "";
    const partes = await Promise.all(
      conTexto.map(async d => `--- DOCUMENTO: "${d.titulo}" ---\n${(await resolverTexto(d.contenido_texto)).slice(0, 8000)}`)
    );
    return partes.join("\n\n");
  };

  const guardar = async (registro) => {
    await base44.entities.ProyectoAnalisis.create(registro);
    queryClient.invalidateQueries({ queryKey: ["proyecto_analisis", proyecto.id] });
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
      await guardar({ proyecto_id: proyecto.id, consulta: texto, respuesta: res, tipo: "consulta" });
      setUltimoMensaje(null);
    } catch (e) {
      setUltimoMensaje(null);
      toast({ title: "Error", description: "No se pudo procesar la consulta. Intentá nuevamente.", variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  const ejecutarAccion = async (tipo) => {
    if (ejecutando || enviando) return;
    const ultimo = analisis[analisis.length - 1];
    if (!ultimo) return;
    setEjecutando(tipo);
    try {
      const docsTexto = await construirContexto();
      const contexto = `${docsTexto ? `DOCUMENTOS DEL PROYECTO:\n${docsTexto}\n\n` : ""}`;
      const respuestaPrev = (await resolverTexto(ultimo.respuesta)).slice(0, 6000);

      if (tipo === "indagacion") {
        const res = await invokeLLM({
          prompt: `${consultor.prompt}\n\n${contexto}El usuario pidió INDAGAR MÁS sobre esta consulta. Profundizá con ángulos nuevos: normativa y jurisprudencia adicional, riesgos no mencionados, escenarios posibles y pasos concretos a seguir. No repitas lo ya dicho.\n\nConsulta original: "${ultimo.consulta}"\n\nRespuesta previa:\n${respuestaPrev}`,
          add_context_from_internet: true,
        });
        await guardar({ proyecto_id: proyecto.id, consulta: `Indagar más sobre: ${ultimo.consulta}`, respuesta: res, tipo: "indagacion" });

      } else if (tipo === "contraparte") {
        const res = await invokeLLM({
          prompt: `${contexto}Cambiá de rol y actuá como el ABOGADO DE LA CONTRAPARTE de nuestro cliente. A partir de la consulta y la respuesta previa, construiste el mejor caso posible en contra de nuestra posición: argumentos fuertes del adversario, debilidades de nuestro caso, defensas, excepciones y pruebas que podrían usar en contra. Sea directo y crítico.\n\nConsulta original: "${ultimo.consulta}"\n\nRespuesta previa de nuestro consultor:\n${respuestaPrev}`,
          add_context_from_internet: true,
        });
        await guardar({ proyecto_id: proyecto.id, consulta: `Punto de vista de la contraparte sobre: ${ultimo.consulta}`, respuesta: res, tipo: "contraparte" });

      } else if (tipo === "juez") {
        const res = await invokeLLM({
          prompt: `${contexto}Actuá como un JUEZ NEUTRAL e imparcial que evalúa la controversia planteada. Dado el planteo del cliente y la réplica de la contraparte, analizá ambas posiciones con objetividad: cuál tiene más sustento legal, cuáles pretensiones probablemente prospere y cuáles no, y cuál sería una previsión realista de sentencia. Fundamentá.\n\nPosición del cliente: "${ultimo.consulta}"\n\nAnálisis previo:\n${respuestaPrev}`,
          add_context_from_internet: true,
        });
        await guardar({ proyecto_id: proyecto.id, consulta: `Punto de vista del juez sobre: ${ultimo.consulta}`, respuesta: res, tipo: "juez" });

      } else if (tipo === "fichas") {
        const res = await invokeLLM({
          prompt: `${consultor.prompt}\n\n${contexto}Generá entre 4 y 6 FICHAS DE IDEAS estratégicas para este proyecto: líneas de acción, alternativas de resolución, argumentos a explorar, información a recolectar, etc. Cada ficha con un título corto y un desarrollo accionable.\n\nConsulta de origen: "${ultimo.consulta}"`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              fichas: {
                type: "array",
                items: {
                  type: "object",
                  properties: { titulo: { type: "string" }, desarrollo: { type: "string" } },
                  required: ["titulo", "desarrollo"],
                },
              },
            },
            required: ["fichas"],
          },
        });
        const fichas = res?.fichas || [];
        if (fichas.length) {
          for (const f of fichas) {
            await guardar({ proyecto_id: proyecto.id, consulta: `Ficha: ${f.titulo}`, respuesta: f.desarrollo, tipo: "ficha", titulo: f.titulo });
          }
        } else {
          toast({ title: "Sin resultados", description: "No se pudieron generar fichas. Intentá nuevamente.", variant: "destructive" });
        }

      } else if (tipo === "escrito") {
        const res = await invokeLLM({
          prompt: `${consultor.prompt}\n\n${contexto}REDACTÁ UN BORRADOR DE ESCRITO judicial completo y formal (jurisdicción San Luis, Argentina), listo para revisar y ajustar. Incluí encabezado (Juzgado, autos, carátula), I. OBJETO, II. HECHOS, III. DERECHO (normas aplicables), IV. PETITORIO y firma. Usá los hechos y datos del proyecto y de la conversación; donde falte un dato dejá [COMPLETAR: dato].\n\nConsulta de origen: "${ultimo.consulta}"`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: { titulo: { type: "string" }, cuerpo: { type: "string" } },
            required: ["titulo", "cuerpo"],
          },
        });
        if (res?.cuerpo) {
          await guardar({ proyecto_id: proyecto.id, consulta: `Escrito: ${res.titulo}`, respuesta: res.cuerpo, tipo: "escrito", titulo: res.titulo });
        } else {
          toast({ title: "Sin resultados", description: "No se pudo redactar el escrito. Intentá nuevamente.", variant: "destructive" });
        }
      }
    } catch (e) {
      toast({ title: "Error", description: "No se pudo completar la acción. Intentá nuevamente.", variant: "destructive" });
    } finally {
      setEjecutando(null);
    }
  };

  const ocupado = enviando || !!ejecutando;

  return (
    <Card className="flex flex-col h-[calc(100vh-320px)] mt-4">
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {analisis.length === 0 && !ocupado && (
          <div className="text-center py-10 text-sm text-muted-foreground">
            <MessagesSquare className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
            Escribí tu primera consulta. El consultor analizará los documentos cargados en el proyecto.
          </div>
        )}
        {analisis.map((a) => {
          const et = ETIQUETAS[a.tipo];
          if (a.tipo === "ficha") {
            return (
              <div key={a.id} className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <p className="font-semibold text-sm">{a.titulo}</p>
                  <Badge className={`ml-auto ${et.color}`}>{et.label}</Badge>
                </div>
                <div className="prose prose-sm max-w-none"><ReactMarkdown>{a.respuesta}</ReactMarkdown></div>
              </div>
            );
          }
          if (a.tipo === "escrito") {
            return (
              <div key={a.id} className="border border-green-200 bg-green-50/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <FilePenLine className="w-4 h-4 text-green-700" />
                  <p className="font-semibold text-sm">{a.titulo}</p>
                  <Badge className={`ml-auto ${et.color}`}>{et.label}</Badge>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => descargarWord(a.titulo, a.respuesta)}>
                    <Download className="w-3 h-3" /> Word
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none"><ReactMarkdown>{a.respuesta}</ReactMarkdown></div>
              </div>
            );
          }
          return (
            <div key={a.id}>
              <div className="flex justify-end mb-2">
                <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 max-w-[85%]">
                  {et && <Badge className={`mb-1 ${et.color}`}>{et.label}</Badge>}
                  <p className="text-sm whitespace-pre-wrap">{a.consulta}</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3 max-w-[85%]">
                  <div className="prose prose-sm max-w-none"><ReactMarkdown>{a.respuesta}</ReactMarkdown></div>
                </div>
              </div>
            </div>
          );
        })}
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
        {ejecutando && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {ejecutando === "indagacion" && "Profundizando el análisis..."}
                {ejecutando === "contraparte" && "Preparando los argumentos de la contraparte..."}
                {ejecutando === "juez" && "Evaluando ambas posiciones como juez..."}
                {ejecutando === "fichas" && "Generando fichas de ideas..."}
                {ejecutando === "escrito" && "Redactando el borrador del escrito..."}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </CardContent>
      <div className="border-t px-3 pt-2">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {ACCIONES.map(acc => {
            const Icon = acc.icon;
            return (
              <Button
                key={acc.tipo}
                size="sm"
                variant="outline"
                disabled={ocupado || analisis.length === 0}
                onClick={() => ejecutarAccion(acc.tipo)}
                className="text-xs gap-1 shrink-0"
              >
                {ejecutando === acc.tipo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                {acc.label}
              </Button>
            );
          })}
        </div>
      </div>
      <div className="border-t p-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder="Escribí tu consulta sobre este proyecto..."
          className="min-h-[44px] max-h-32 resize-none"
        />
        <DictadoVoz
          disabled={ocupado}
          onTexto={(texto) => setInput(prev => prev ? `${prev} ${texto}` : texto)}
        />
        <Button onClick={enviar} disabled={ocupado || !input.trim()} size="icon" className="h-auto shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}