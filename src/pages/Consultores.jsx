import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, ArrowLeft, Scale, Calculator, Briefcase, Landmark, Home, Heart } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { invokeLLM } from "@/lib/llm";

const CONSULTORES = [
  {
    id: "juridico",
    nombre: "Consultor Jurídico",
    descripcion: "Asesoramiento legal general: civil, comercial, administrativo y daños.",
    icon: Scale,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    prompt: "Sos un consultor jurídico experto del estudio Pérez & Funes (San Luis, Argentina). Respondé con claridad y fundamento normativo, citando leyes y jurisprudencia argentina aplicable cuando corresponda. Aclará siempre que es orientación preliminar y no reemplaza el patrocinio formal.",
  },
  {
    id: "financiero",
    nombre: "Consultor Financiero / Contable",
    descripcion: "Impuestos, monotributo, facturación, honorarios y gestión financiera del estudio.",
    icon: Calculator,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    prompt: "Sos un consultor financiero y contable especializado en estudios jurídicos de Argentina. Orientás sobre monotributo, IVA, facturación AFIP, honorarios profesionales (aranceles IUS), gestión de caja y presupuestos. Respondé con criterio práctico y normativa argentina vigente.",
  },
  {
    id: "laboral",
    nombre: "Consultor Laboral",
    descripcion: "Despidos, accidentes de trabajo, indemnizaciones y relaciones laborales.",
    icon: Briefcase,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    prompt: "Sos un consultor especialista en derecho laboral argentino (LCT, ART, ley de contratos de trabajo). Orientás sobre despidos, indemnizaciones, accidentes de trabajo, suspensiones y procedimientos. Cité la normativa y calculá montos estimativos cuando se aporten datos.",
  },
  {
    id: "previsional",
    nombre: "Consultor Previsional",
    descripcion: "Jubilaciones, pensiones, ANSES y trámites previsionales.",
    icon: Landmark,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    prompt: "Sos un consultor previsional experto en el sistema argentino (ANSES, ley 24.241 y modificatorias). Orientás sobre jubilaciones, pensiones por invalidez y por fallecimiento, moratorias, requisitos de edad y aportes, y trámites. Aclará que las estimaciones son orientativas.",
  },
  {
    id: "inmobiliario",
    nombre: "Consultor Inmobiliario",
    descripcion: "Alquileres, compraventa, escrituras y disputas sobre inmuebles.",
    icon: Home,
    color: "text-cyan-600 bg-cyan-50 border-cyan-200",
    prompt: "Sos un consultor en derecho inmobiliario argentino. Orientás sobre contratos de alquiler (ley 27.551), compraventa, escrituración, desalojos, usucapión y disputas sobre inmuebles. Cité la normativa aplicable y advertí riesgos.",
  },
  {
    id: "familia",
    nombre: "Consultor de Familia",
    descripcion: "Divorcios, cuota alimentaria, tenencia, régimen de visitas y sucesiones.",
    icon: Heart,
    color: "text-rose-600 bg-rose-50 border-rose-200",
    prompt: "Sos un consultor en derecho de familia y sucesiones argentino. Orientás sobre divorcios (ley 26.999), cuota alimentaria, tenencia, régimen de comunicación, adopción y sucesiones. Tratá los temas con sensibilidad y fundamento normativo.",
  },
];

export default function Consultores() {
  const [activo, setActivo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const seleccionar = (c) => {
    setActivo(c);
    setMessages([{ role: "assistant", content: `Hola, soy el **${c.nombre}**. ${c.descripcion} ¿En qué puedo orientarte?` }]);
  };

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || isLoading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: texto }]);
    setIsLoading(true);
    try {
      const prompt = `${activo.prompt}\n\nConsulta del usuario:\n${texto}`;
      const res = await invokeLLM({ prompt, add_context_from_internet: true });
      setMessages(prev => [...prev, { role: "assistant", content: res }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "*Error al procesar la consulta. Intentá nuevamente.*" }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (activo) {
    const Icon = activo.icon;
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => { setActivo(null); setMessages([]); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${activo.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-semibold">{activo.nombre}</h1>
            <p className="text-sm text-muted-foreground">{activo.descripcion}</p>
          </div>
        </div>

        <Card className="flex flex-col h-[calc(100vh-220px)]">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-2xl px-4 py-3 max-w-[85%]"
                  : "bg-muted rounded-2xl px-4 py-3 max-w-[85%]"}>
                  {m.role === "user"
                    ? <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    : <div className="prose prose-sm max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando consulta...
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </CardContent>
          <div className="border-t p-3 flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
              placeholder="Escribí tu consulta..."
              className="min-h-[44px] max-h-32 resize-none"
            />
            <Button onClick={enviar} disabled={isLoading || !input.trim()} size="icon" className="h-auto">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" />
          Consultores IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Elegí el especialista según tu interés. Cada consultor orienta con IA sobre su área, con fundamento en normativa argentina.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONSULTORES.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => seleccionar(c)}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${c.color} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base group-hover:text-accent transition-colors">{c.nombre}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-[10px]">IA</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.descripcion}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}