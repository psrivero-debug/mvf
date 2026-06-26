import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { invokeLLM, invokeBoth } from "@/lib/llm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Save, Copy, Loader2, FileText, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const docTemplates = [
  { value: "carta_documento", label: "Carta Documento" },
  { value: "demanda", label: "Demanda" },
  { value: "contestacion", label: "Contestación de Demanda" },
  { value: "recurso", label: "Recurso de Apelación" },
  { value: "contrato", label: "Contrato" },
  { value: "escrito", label: "Escrito Judicial" },
  { value: "dictamen", label: "Dictamen" },
  { value: "nota", label: "Nota / Memo Interno" },
];

export default function DocumentDrafting() {
  const [docType, setDocType] = useState("carta_documento");
  const [context, setContext] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [compareDocs, setCompareDocs] = useState(null);
  const queryClient = useQueryClient();

  const generateDocument = async () => {
    if (!context.trim()) return;
    setIsGenerating(true);
    const templateLabel = docTemplates.find(t => t.value === docType)?.label || docType;

    const prompt = `Eres un abogado argentino experto redactor de documentos legales. 
Redacta un documento de tipo "${templateLabel}" con las siguientes características:

CONTEXTO DEL CASO:
${context}

${keyPoints ? `PUNTOS CLAVE A INCLUIR:\n${keyPoints}` : ""}

INSTRUCCIONES:
- Usa formato profesional y formal argentino
- Incluye encabezados y estructura adecuada al tipo de documento
- Referencia artículos de ley cuando corresponda (Constitución Nacional, Código Civil y Comercial, leyes aplicables)
- Usa terminología jurídica argentina apropiada
- El documento debe estar listo para presentar (con los campos de datos marcados como [COMPLETAR] donde falte información específica)
- Incluye lugar y fecha, datos de las partes, objeto, fundamentos de derecho y petitorio cuando aplique

Redacta el documento completo:`;

    if (compareMode) {
      const { base44: b44, gemini: gem } = await invokeBoth({ prompt });
      setCompareDocs({ base44: b44, gemini: gem });
    } else {
      const result = await invokeLLM({ prompt });
      setGeneratedDoc(result);
    }
    setIsGenerating(false);
  };

  const saveDocument = async () => {
    if (!generatedDoc || !docTitle.trim()) return;
    await base44.entities.Document.create({
      title: docTitle,
      document_type: docType,
      content: generatedDoc,
      status: "borrador"
    });
    queryClient.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Documento guardado correctamente");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedDoc);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold">Redacción con IA</h1>
        <p className="text-muted-foreground mt-1">Asistente inteligente para redacción de documentos legales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-accent" />
              Configurar Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Tipo de Documento</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {docTemplates.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Contexto del Caso *</Label>
              <Textarea
                placeholder="Describe los hechos, las partes involucradas, la situación procesal, etc..."
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={6}
              />
            </div>

            <div className="grid gap-2">
              <Label>Ideas / Puntos Clave</Label>
              <Textarea
                placeholder="Enumera los puntos principales que debe incluir el documento..."
                value={keyPoints}
                onChange={e => setKeyPoints(e.target.value)}
                rows={4}
              />
            </div>

            <Button onClick={generateDocument} disabled={isGenerating || !context.trim()} className="w-full gap-2">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isGenerating ? "Generando documento..." : "Generar Documento"}
            </Button>
            <Button
              variant={compareMode ? "default" : "outline"}
              onClick={() => { setCompareMode(c => !c); setCompareDocs(null); }}
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {compareMode ? "Comparando ambos motores" : "Comparar Base44 vs Gemini"}
            </Button>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              Documento Generado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compareMode ? (
              compareDocs ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Base44
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { navigator.clipboard.writeText(compareDocs.base44 || ""); toast.success("Copiado"); }}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="prose prose-sm max-w-none p-3 bg-muted/50 rounded-lg max-h-[55vh] overflow-y-auto">
                      <ReactMarkdown>{compareDocs.base44 || "*Sin respuesta — créditos agotados.*"}</ReactMarkdown>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Gemini
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { navigator.clipboard.writeText(compareDocs.gemini || ""); toast.success("Copiado"); }}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="prose prose-sm max-w-none p-3 bg-muted/50 rounded-lg max-h-[55vh] overflow-y-auto">
                      <ReactMarkdown>{compareDocs.gemini || "*Sin respuesta.*"}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Sparkles className="w-16 h-16 text-muted-foreground/20" />
                  <p className="text-muted-foreground mt-4">Las respuestas de ambos motores aparecerán aquí</p>
                  <p className="text-xs text-muted-foreground mt-1">Completa el formulario y presiona "Generar"</p>
                </div>
              )
            ) : !generatedDoc ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-16 h-16 text-muted-foreground/20" />
                <p className="text-muted-foreground mt-4">El documento generado aparecerá aquí</p>
                <p className="text-xs text-muted-foreground mt-1">Completa el formulario y presiona "Generar"</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Título para guardar..."
                    value={docTitle}
                    onChange={e => setDocTitle(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={copyToClipboard} size="icon">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button onClick={saveDocument} disabled={!docTitle.trim()} className="gap-2">
                    <Save className="w-4 h-4" /> Guardar
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-lg max-h-[60vh] overflow-y-auto">
                  <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}