import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Trash2, Eye, EyeOff, Plus, Globe, Wand2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LOGO_URL = "https://media.base44.com/images/public/69c424df37de29e9326cbefa/acd4af465_image.png";

const SERVICIOS = [
  "Consultas Legales",
  "Defensa de Derechos",
  "Derecho Civil",
  "Derecho Laboral",
  "Negocios Inmobiliarios",
  "Derecho de Familia",
  "Derecho Comercial",
  "Derecho Administrativo",
];

const ESTILOS = [
  { label: "Profesional y elegante", value: "professional" },
  { label: "Moderno y dinámico", value: "modern" },
  { label: "Minimalista", value: "minimal" },
  { label: "Impactante y llamativo", value: "bold" },
];

function buildPrompt(form) {
  const estiloMap = {
    professional: "professional, elegant, dark navy blue and gold color scheme, law firm aesthetic, clean typography",
    modern: "modern, dynamic, sleek design, blue and white tones, contemporary law firm branding",
    minimal: "minimalist, clean white space, thin elegant fonts, subtle gold accents, sophisticated",
    bold: "bold, high contrast, impactful, strong typography, deep dark background with bright gold highlights",
  };
  const estilo = estiloMap[form.estilo] || estiloMap["professional"];

  return `Create a professional legal services promotional flyer/advertisement for "${form.titulo}" — a law firm called "Pérez & Funes Estudio Jurídico". 

Service being promoted: ${form.servicio}
${form.descripcion ? `Key message: ${form.descripcion}` : ""}

Design style: ${estilo}
Include prominent space for: firm name "Pérez & Funes", phone number "${form.telefono || "+54 266 XXX-XXXX"}", address "${form.domicilio || "San Luis, Argentina"}"
Layout: portrait orientation (4:5 ratio flyer), with scales of justice imagery or legal symbols, sophisticated background, clear text hierarchy
The firm logo/seal should be prominent. Include "Consultá hoy" call to action.
High quality, print-ready advertising flyer design. No real people, focus on design elements.`;
}

export default function Publicidad() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    servicio: "",
    descripcion: "",
    estilo: "professional",
    telefono: "+54 266 XXX-XXXX",
    domicilio: "San Luis, Argentina",
  });

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

  const handleGenerar = async () => {
    if (!form.titulo || !form.servicio) return;
    setGenerating(true);
    const prompt = buildPrompt(form);
    const { url } = await base44.integrations.Core.GenerateImage({ prompt });
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
    setForm({ titulo: "", servicio: "", descripcion: "", estilo: "professional", telefono: "+54 266 XXX-XXXX", domicilio: "San Luis, Argentina" });
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
          <p className="text-muted-foreground mt-1">Generá flyers con IA y publicalos en la web del estudio</p>
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
          <p className="text-sm text-muted-foreground/60 mt-1">Creá tu primer flyer con IA</p>
          <Button className="mt-4 gap-2" onClick={() => setDialogOpen(true)}>
            <Sparkles className="w-4 h-4" /> Generar primer flyer
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {flyers.map((flyer) => (
            <div key={flyer.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Imagen */}
              <div className="relative aspect-[4/5] bg-muted">
                {flyer.imagen_url ? (
                  <img src={flyer.imagen_url} alt={flyer.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sin imagen</div>
                )}
                {/* Logo overlay */}
                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 p-0.5 shadow">
                  <img src={LOGO_URL} alt="Logo" className="w-full h-full rounded-full object-cover" />
                </div>
                {flyer.publicado && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5" /> Web
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-sm truncate">{flyer.titulo}</p>
                  <Badge variant="secondary" className="text-xs mt-1">{flyer.servicio}</Badge>
                </div>

                {/* Teléfono y domicilio */}
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {flyer.telefono && <p>📞 {flyer.telefono}</p>}
                  {flyer.domicilio && <p>📍 {flyer.domicilio}</p>}
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={flyer.publicado}
                      onCheckedChange={() => togglePublicado(flyer)}
                      className="scale-75"
                    />
                    <span className="text-xs text-muted-foreground">
                      {flyer.publicado ? <span className="text-green-600 font-medium">Publicado</span> : "Publicar"}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => deleteMutation.mutate(flyer.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
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

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título del flyer *</Label>
              <Input
                placeholder="Ej: Consultá tu caso hoy"
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Servicio a promocionar *</Label>
              <Select value={form.servicio} onValueChange={v => setForm({ ...form, servicio: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICIOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Mensaje clave (opcional)</Label>
              <Textarea
                placeholder="Ej: Primera consulta sin cargo, asesoramiento personalizado..."
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Estilo del diseño</Label>
              <Select value={form.estilo} onValueChange={v => setForm({ ...form, estilo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTILOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input
                  placeholder="+54 266 XXX-XXXX"
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Domicilio</Label>
                <Input
                  placeholder="San Luis, Argentina"
                  value={form.domicilio}
                  onChange={e => setForm({ ...form, domicilio: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={generating}>Cancelar</Button>
            <Button
              onClick={handleGenerar}
              disabled={!form.titulo || !form.servicio || generating}
              className="gap-2"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generar con IA</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}