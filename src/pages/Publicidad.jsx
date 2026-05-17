import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Trash2, Plus, Globe, Wand2, ImageIcon, Download, Share2 } from "lucide-react";
import FlyerForm from "@/components/publicidad/FlyerForm";
import FlyerFormatsModal from "@/components/publicidad/FlyerFormatsModal";
import { buildBasePromptContext, buildFallbackPrompt } from "@/components/publicidad/buildPrompt";

export default function Publicidad() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formatsFlyer, setFormatsFlyer] = useState(null);
  const [generating, setGenerating] = useState(false);

  const { data: flyers = [], isLoading } = useQuery({
    queryKey: ["flyers"],
    queryFn: () => base44.entities.Flyer.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Flyer.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flyers"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Flyer.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flyers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Flyer.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flyers"] }),
  });

  const handleGenerar = async (form) => {
    setGenerating(true);
    const { estilo, layout } = buildBasePromptContext(form, "post");
    const telefono = form.telefono || "2664 169108";
    const domicilio = form.domicilio || "25 de Mayo N° 477";

    // Paso 0: Corregir ortografía del título y descripción antes de usarlos en el prompt
    let tituloCorregido = form.titulo;
    let descripcionCorregida = form.descripcion || "Asesoramiento legal personalizado";
    try {
      const correccion = await base44.integrations.Core.InvokeLLM({
        prompt: `Corregí la ortografía de estos textos en español. Devolvé SOLO un JSON con las claves "titulo" y "descripcion", sin explicaciones:
- titulo: "${form.titulo}"
- descripcion: "${form.descripcion || "Asesoramiento legal personalizado"}"`,
        response_json_schema: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            descripcion: { type: "string" },
          },
        },
      });
      if (correccion?.titulo) tituloCorregido = correccion.titulo;
      if (correccion?.descripcion) descripcionCorregida = correccion.descripcion;
    } catch { /* usa los valores originales si falla */ }

    // Paso 1: IA genera prompt visual enriquecido
    let imagePrompt;
    try {
      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un experto en diseño gráfico publicitario para estudios jurídicos argentinos.
Generá un prompt detallado en inglés para crear una imagen publicitaria de alta calidad para la firma "Pérez & Funes Estudio Jurídico" de San Luis, Argentina.

Datos del flyer:
- Título: "${tituloCorregido}"
- Servicio: "${form.servicio}"
- Mensaje clave: "${descripcionCorregida}"
- Estilo visual: ${estilo}
- Formato: ${layout}
- Teléfono: ${telefono}
- Domicilio: ${domicilio}

El prompt debe describir:
1. Una imagen de fondo representativa y realista para "${form.servicio}" (ej: para Derecho de Familia → familia en sala de estar, para Derecho Laboral → personas en oficina, para Inmobiliario → edificios o contratos, etc.)
2. Superposición de elementos gráficos del estudio jurídico
3. Tipografía y texto a incluir
4. Iluminación, composición y paleta de colores acorde al estilo
5. Que NO aparezcan personas reales, sino ambientaciones, objetos o simbolismos

Respondé SOLO con el prompt en inglés, listo para usar en un generador de imágenes. Sin explicaciones adicionales.`,
        response_json_schema: null,
      });
      imagePrompt = typeof llmResult === "string" ? llmResult : String(llmResult);
    } catch {
      imagePrompt = buildFallbackPrompt(form, "post");
    }

    // Paso 2: Generar la imagen con el prompt enriquecido
    const { url } = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
    const flyer = await createMutation.mutateAsync({
      titulo: form.titulo,
      servicio: form.servicio,
      descripcion: form.descripcion,
      imagen_url: url,
      prompt_usado: prompt,
      publicado: false,
      telefono: form.telefono,
      domicilio: form.domicilio,
    });
    setGenerating(false);
    setDialogOpen(false);
    // Abrir modal de formatos automáticamente
    setFormatsFlyer({ ...flyer, imagen_url: url, _form: form });
  };

  const togglePublicado = (flyer) => {
    updateMutation.mutate({ id: flyer.id, data: { publicado: !flyer.publicado } });
  };

  const publicados = flyers.filter(f => f.publicado).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Publicidad</h1>
          <p className="text-muted-foreground mt-1">Generá flyers con IA para redes sociales y publicalos en la web del estudio</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 text-sm py-1.5 px-3">
            <Globe className="w-3.5 h-3.5 text-green-500" />
            {publicados} publicado{publicados !== 1 ? "s" : ""}
          </Badge>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nuevo Flyer
          </Button>
        </div>
      </div>

      {/* Grid de flyers */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : flyers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-2xl text-center px-4">
          <Wand2 className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">Aún no hay flyers generados</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Creá tu primer flyer con IA para redes sociales</p>
          <Button className="mt-4 gap-2" onClick={() => setDialogOpen(true)}>
            <Sparkles className="w-4 h-4" /> Generar primer flyer
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {flyers.map((flyer) => (
            <FlyerCard
              key={flyer.id}
              flyer={flyer}
              onTogglePublicado={() => togglePublicado(flyer)}
              onDelete={() => deleteMutation.mutate(flyer.id)}
              onVerFormatos={() => setFormatsFlyer(flyer)}
            />
          ))}
        </div>
      )}

      {/* Dialog Nuevo Flyer */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" /> Generar Flyer con IA
            </DialogTitle>
          </DialogHeader>
          <FlyerForm
            generating={generating}
            onSubmit={handleGenerar}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de formatos múltiples */}
      {formatsFlyer && (
        <FlyerFormatsModal
          flyer={formatsFlyer}
          onClose={() => setFormatsFlyer(null)}
          onSaveFormat={(id, data) => updateMutation.mutate({ id, data })}
        />
      )}
    </div>
  );
}

function FlyerCard({ flyer, onTogglePublicado, onDelete, onVerFormatos }) {
  const LOGO_URL = "https://media.base44.com/images/public/69c424df37de29e9326cbefa/acd4af465_image.png";
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/5] bg-muted">
        {flyer.imagen_url ? (
          <img src={flyer.imagen_url} alt={flyer.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            <ImageIcon className="w-8 h-8 opacity-30" />
          </div>
        )}
        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 p-0.5 shadow">
          <img src={LOGO_URL} alt="Logo" className="w-full h-full rounded-full object-cover" />
        </div>
        {flyer.publicado && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Globe className="w-2.5 h-2.5" /> Web
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="font-semibold text-sm truncate">{flyer.titulo}</p>
          <Badge variant="secondary" className="text-xs mt-1">{flyer.servicio}</Badge>
        </div>
        <div className="text-xs text-muted-foreground space-y-0.5">
          {flyer.telefono && <p>📞 {flyer.telefono}</p>}
          {flyer.domicilio && <p>📍 {flyer.domicilio}</p>}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={onVerFormatos}
        >
          <Share2 className="w-3.5 h-3.5" /> Ver formatos para redes
        </Button>
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-2">
            <Switch checked={flyer.publicado} onCheckedChange={onTogglePublicado} className="scale-75" />
            <span className="text-xs text-muted-foreground">
              {flyer.publicado ? <span className="text-green-600 font-medium">Publicado</span> : "Publicar"}
            </span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}