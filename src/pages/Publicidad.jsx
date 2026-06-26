import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { invokeLLM } from "@/lib/llm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2, Download, RefreshCw, X } from "lucide-react";

export default function Publicidad() {
  const [paso, setPaso] = useState(1); // 1: formulario, 2: diseños
  const [generando, setGenerando] = useState(false);
  const [diseños, setDiseños] = useState([]);
  const [formData, setFormData] = useState({
    servicio: "",
    descripcion: "",
    publico: "",
    claveVisual: "",
  });
  const [selectedDesign, setSelectedDesign] = useState(null);

  const handleGenerar = async () => {
    if (!formData.servicio.trim()) {
      alert("Especificá el servicio a promocionar");
      return;
    }

    setGenerando(true);

    try {
      // Generar 3 opciones de diseños diferentes
      const opciones = await invokeLLM({
        model: "gemini_3_1_pro",
        prompt: `Sos un diseñador gráfico profesional especializado en marketing para bufetes de abogados argentinos.

El usuario quiere promocionar: "${formData.servicio}"
${formData.descripcion ? `Detalles: ${formData.descripcion}` : ""}
${formData.publico ? `Público objetivo: ${formData.publico}` : ""}
${formData.claveVisual ? `Estilo visual: ${formData.claveVisual}` : ""}

Generá 3 conceptos visuales DIFERENTES y ATRACTIVOS para marketing. Para cada uno, describe:
1. NOMBRE del concepto
2. DESCRIPCIÓN visual detallada (colores, elementos gráficos, composición, mood)
3. PROMPTS de imagen para generar

Responde en JSON:
{
  "opciones": [
    {
      "nombre": "string",
      "descripcion": "string",
      "prompts": ["prompt1 para imagen 1", "prompt2 para imagen 2", "prompt3 para imagen 3"]
    },
    ...
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            opciones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nombre: { type: "string" },
                  descripcion: { type: "string" },
                  prompts: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      // Generar imágenes para cada opción
      const diseñosConImagenes = await Promise.all(
        (opciones.opciones || []).map(async (opcion) => {
          const imagenes = await Promise.all(
            opcion.prompts.map(prompt =>
              base44.integrations.Core.GenerateImage({
                prompt: `Professional legal services marketing design. ${prompt}. High quality, attractive, Argentine law firm aesthetic.`
              })
            )
          );

          return {
            nombre: opcion.nombre,
            descripcion: opcion.descripcion,
            imagenes: imagenes.map(img => img.url)
          };
        })
      );

      setDiseños(diseñosConImagenes);
      setPaso(2);
    } catch (error) {
      console.error(error);
      alert("Error generando diseños. Intentá de nuevo.");
    } finally {
      setGenerando(false);
    }
  };

  const handleDescargar = async (imageUrl, nombreDiseno) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `diseño-marketing-${nombreDiseno.toLowerCase().replace(/\s+/g, "-")}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Error descargando imagen");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Diseños para Marketing</h1>
        <p className="text-muted-foreground mt-1">Generá diseños atractivos con IA para promocionar tus servicios legales</p>
      </div>

      {paso === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Formulario */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Servicio a promocionar *</label>
                <Input
                  placeholder="Ej: Derecho de familia, divorcios, herencias..."
                  value={formData.servicio}
                  onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción (opcional)</label>
                <Textarea
                  placeholder="Detalles sobre el servicio, puntos de venta, etc."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Público objetivo (opcional)</label>
                <Input
                  placeholder="Ej: Mujeres, jóvenes profesionales, empresas..."
                  value={formData.publico}
                  onChange={(e) => setFormData({ ...formData, publico: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estilo visual (opcional)</label>
                <Input
                  placeholder="Ej: Moderno y minimalista, clásico y corporativo, creativo..."
                  value={formData.claveVisual}
                  onChange={(e) => setFormData({ ...formData, claveVisual: e.target.value })}
                  className="text-sm"
                />
              </div>

              <Button
                onClick={handleGenerar}
                disabled={generando}
                className="w-full gap-2 py-6 text-base"
              >
                {generando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando diseños...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar 3 opciones
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm bg-accent/5">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-sm">¿Cómo funciona?</h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">1</span>
                    <span>Describí el servicio que querés promocionar</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">2</span>
                    <span>La IA generará 3 conceptos visuales diferentes</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">3</span>
                    <span>Mirá las opciones y descargá las que te gusten</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">4</span>
                    <span>Podés regenerar o solicitar nuevas variantes</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-muted/30">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Cuanta más información proporciones, mejor serán los diseños. Describí el estilo que buscás y el público al que va dirigido.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Botón volver */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold">3 Opciones de Diseño</h2>
            <Button
              variant="outline"
              onClick={() => {
                setPaso(1);
                setDiseños([]);
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Generar nuevos
            </Button>
          </div>

          {/* Galería de diseños */}
          <div className="grid grid-cols-1 gap-8">
            {diseños.map((diseño, idx) => (
              <Card key={idx} className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{diseño.nombre}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{diseño.descripcion}</p>
                  </div>

                  {/* Galería de imágenes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {diseño.imagenes.map((imagen, imgIdx) => (
                      <div key={imgIdx} className="relative group rounded-lg overflow-hidden bg-muted aspect-square">
                        <img src={imagen} alt={`${diseño.nombre} ${imgIdx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1"
                            onClick={() => handleDescargar(imagen, `${diseño.nombre}-${imgIdx + 1}`)}
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}