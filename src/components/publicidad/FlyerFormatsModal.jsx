import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Download, Copy, Check, ImageIcon, Film, LayoutTemplate, Maximize2, SpellCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { buildBasePromptContext, buildFallbackPrompt } from "@/components/publicidad/buildPrompt";

const FORMATOS = [
  {
    id: "post",
    label: "Post",
    icon: ImageIcon,
    ratio: "1:1",
    aspecto: "aspect-square",
    descripcion: "Feed de Instagram y Facebook",
  },
  {
    id: "historia",
    label: "Historia",
    icon: Maximize2,
    ratio: "9:16",
    aspecto: "aspect-[9/16]",
    descripcion: "Stories de Instagram y Facebook",
  },
  {
    id: "video",
    label: "Video/Reels",
    icon: Film,
    ratio: "9:16",
    aspecto: "aspect-[9/16]",
    descripcion: "Cover para Reels y TikTok",
  },
  {
    id: "banner",
    label: "Banner",
    icon: LayoutTemplate,
    ratio: "16:9",
    aspecto: "aspect-video",
    descripcion: "Portada de Facebook / LinkedIn",
  },
];

function buildTextoPromo(flyer, formato) {
  const servicio = flyer.servicio || "servicios legales";
  const titulo = flyer.titulo || "";
  const telefono = flyer.telefono || "2664 169108";
  const domicilio = flyer.domicilio || "25 de Mayo N° 477";

  const mensajes = {
    post: `⚖️ ${titulo}\n\n¿Necesitás asesoramiento en ${servicio}? En Pérez & Funes Estudio Jurídico te acompañamos en cada paso.\n\n✅ Asesoramiento personalizado\n✅ Experiencia y compromiso\n✅ Primera consulta sin cargo\n\n📞 ${telefono}\n📍 ${domicilio}, San Luis\n\n👉 Contactanos hoy y resolvé tu situación legal.\n\n#EstudioJuridico #${servicio.replace(/\s+/g, "")} #DerechoArgentino #SanLuis #PérezYFunes`,
    historia: `⚖️ ¿Tenés un problema legal?\n\n¡Nosotros te ayudamos!\n\n${titulo}\n\nPérez & Funes\nEstudio Jurídico\n\n📞 ${telefono}\n\nSwipeá para más info 👆\n\n#Abogados #${servicio.replace(/\s+/g, "")} #SanLuis`,
    video: `🎬 Nuevo video: ${titulo}\n\nEn Pérez & Funes te explicamos todo sobre ${servicio}.\n\n📲 Seguinos para más contenido legal\n📞 ${telefono}\n📍 ${domicilio}\n\n#DerechoArgentino #EstudioJuridico #SanLuis #Reels`,
    banner: `Pérez & Funes Estudio Jurídico | ${servicio} | ${telefono} | ${domicilio}, San Luis | Asesoramiento legal personalizado — ¡Consultanos hoy!`,
  };

  return mensajes[formato] || mensajes["post"];
}

const LOGO_URL = "https://media.base44.com/images/public/69c424df37de29e9326cbefa/acd4af465_image.png";

export default function FlyerFormatsModal({ flyer, onClose, onSaveFormat }) {
  const [activeTab, setActiveTab] = useState("post");
  const [generando, setGenerando] = useState({});
  const [imagenes, setImagenes] = useState({
    post: flyer.imagen_url || null,
    historia: null,
    video: null,
    banner: null,
  });
  const [textos, setTextos] = useState(() => ({
    post: buildTextoPromo(flyer, "post"),
    historia: buildTextoPromo(flyer, "historia"),
    video: buildTextoPromo(flyer, "video"),
    banner: buildTextoPromo(flyer, "banner"),
  }));
  const [corrigiendo, setCorrigiendo] = useState({});
  const [copiado, setCopiado] = useState(null);
  const [editandoOverlay, setEditandoOverlay] = useState(false);
  const [overlay, setOverlay] = useState({
    titulo: flyer.titulo || "",
    subtitulo: flyer.servicio || "",
    telefono: flyer.telefono || "2664 169108",
    domicilio: flyer.domicilio || "25 de Mayo N° 477",
  });

  const handleGenerarFormato = async (formatoId) => {
    setGenerando(prev => ({ ...prev, [formatoId]: true }));
    const formData = flyer._form || {
      titulo: flyer.titulo,
      servicio: flyer.servicio,
      descripcion: flyer.descripcion,
      estilo: "professional",
      telefono: flyer.telefono,
      domicilio: flyer.domicilio,
    };

    const { estilo, layout } = buildBasePromptContext(formData, formatoId);
    const telefono = formData.telefono || "2664 169108";
    const domicilio = formData.domicilio || "25 de Mayo N° 477";

    // Paso 1: IA genera un prompt visual enriquecido con imágenes representativas
    let imagePrompt;
    try {
      const llmResult = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_1_pro",
        prompt: `You are a world-class art director specializing in premium legal services advertising for Argentine law firms.

Create a highly detailed image generation prompt in English for a professional legal flyer background.

Service being promoted: "${formData.servicio}"
Visual style: ${estilo}
Format/layout: ${layout}

Requirements for the prompt you generate:
- Describe a cinematic, ultra-high-quality photographic or 3D render scene
- Include specific thematic elements for "${formData.servicio}": relevant objects, architectural details, symbolic imagery
- Mandatory elements: marble courthouse columns, leather-bound law books, golden scales of justice, official legal seals, mahogany desk, aged parchment textures
- Color palette: deep navy blue (#0a1628), rich gold (#c9a84c), ivory white, dark burgundy accents — luxury law firm aesthetic
- Lighting: dramatic side lighting, golden hour warm glow, subtle lens flare, soft bokeh background
- Composition: leave the top 25% and bottom 30% with dark gradient areas (important for text overlay)
- Style: Award-winning advertising photography, 8K resolution, ultra-detailed, dramatic mood
- NO people, NO faces, NO text, NO letters, NO numbers, NO words, NO typography anywhere

Respond ONLY with the image prompt in English. No explanations, no preamble.`,
        response_json_schema: null,
      });
      imagePrompt = (typeof llmResult === "string" ? llmResult : String(llmResult)) + " NO text, NO letters, NO words, NO numbers, NO typography whatsoever. Pure visual background only.";
    } catch {
      imagePrompt = buildFallbackPrompt(formData, formatoId);
    }

    // Paso 2: Generar la imagen con el prompt enriquecido
    const { url } = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
    setImagenes(prev => ({ ...prev, [formatoId]: url }));
    setGenerando(prev => ({ ...prev, [formatoId]: false }));
  };

  const handleDescargar = async (url, formatoId) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `flyer-${flyer.titulo || "perez-funes"}-${formatoId}.jpg`;
    link.target = "_blank";
    link.click();
  };

  const handleCopiarTexto = (formatoId) => {
    navigator.clipboard.writeText(textos[formatoId]);
    setCopiado(formatoId);
    setTimeout(() => setCopiado(null), 2000);
  };

  const handleCorregirTexto = async (formatoId) => {
    setCorrigiendo(prev => ({ ...prev, [formatoId]: true }));
    const corregido = await base44.integrations.Core.InvokeLLM({
      model: "claude_sonnet_4_6",
      prompt: `Sos un corrector de textos publicitarios profesional en español rioplatense.

Tu tarea es corregir el siguiente texto SIN cambiar su estructura, estilo ni contenido. Solo debés:
1. Corregir errores ortográficos (tildes, letras incorrectas, palabras mal escritas)
2. Corregir errores gramaticales
3. Asegurarte que cada oración comience con mayúscula
4. Corregir puntuación incorrecta
5. Mantener EXACTAMENTE los emojis, saltos de línea, hashtags y el orden del contenido

NO agregues ni quites información. NO reformules oraciones. NO cambies palabras correctas.

TEXTO A CORREGIR:
${textos[formatoId]}

Respondé ÚNICAMENTE con el texto corregido, sin comentarios ni explicaciones.`,
    });
    setTextos(prev => ({ ...prev, [formatoId]: typeof corregido === "string" ? corregido : String(corregido) }));
    setCorrigiendo(prev => ({ ...prev, [formatoId]: false }));
  };

  const formatoActual = FORMATOS.find(f => f.id === activeTab);
  const imagenActual = imagenes[activeTab];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Formatos para Redes — {flyer.titulo}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            {FORMATOS.map(f => (
              <TabsTrigger key={f.id} value={f.id} className="gap-1.5 text-xs">
                <f.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{f.label}</span>
                <span className="sm:hidden">{f.ratio}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {FORMATOS.map(formato => (
            <TabsContent key={formato.id} value={formato.id} className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{formato.ratio}</Badge>
                <span className="text-sm text-muted-foreground">{formato.descripcion}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Imagen con overlay */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Imagen</p>
                    <Button
                      size="sm"
                      variant={editandoOverlay ? "default" : "outline"}
                      className="gap-1.5 text-xs h-7"
                      onClick={() => setEditandoOverlay(v => !v)}
                    >
                      {editandoOverlay ? <><Check className="w-3 h-3" /> Listo</> : <><SpellCheck className="w-3 h-3" /> Editar texto</>}
                    </Button>
                  </div>

                  {/* Preview con overlay */}
                  <div className={`${formato.aspecto} w-full max-w-[280px] mx-auto bg-slate-800 rounded-xl overflow-hidden border border-border relative`}>
                    {imagenes[formato.id] ? (
                      <img src={imagenes[formato.id]} alt={formato.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <formato.icon className="w-8 h-8 opacity-30" />
                        <p className="text-xs">Sin imagen</p>
                      </div>
                    )}
                    {/* Overlay de texto profesional */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none"
                      style={{background: "linear-gradient(to bottom, rgba(5,10,30,0.88) 0%, rgba(5,10,30,0.2) 40%, rgba(5,10,30,0.2) 55%, rgba(5,10,30,0.92) 100%)"}}>
                      {/* Header: logo + nombre estudio */}
                      <div className="flex items-center gap-2 px-3 pt-3">
                        <img src={LOGO_URL} alt="Logo" className="w-8 h-8 rounded-full object-cover shadow-lg" style={{border:"2px solid rgba(250,204,21,0.7)"}} />
                        <div>
                          <p className="text-yellow-300 text-[9px] font-bold tracking-widest uppercase leading-none">Pérez & Funes</p>
                          <p className="text-white text-[8px] tracking-wide leading-none mt-0.5 opacity-80">Estudio Jurídico</p>
                        </div>
                      </div>
                      {/* Footer: título + servicio + contacto */}
                      <div className="px-3 pb-3 space-y-1">
                        <p className="text-white font-bold text-[13px] leading-tight" style={{textShadow:"0 2px 8px rgba(0,0,0,0.9)"}}>{overlay.titulo}</p>
                        <p className="text-yellow-300 text-[9px] font-medium tracking-wide uppercase leading-tight">{overlay.subtitulo}</p>
                        <div className="w-8 h-px bg-yellow-400 opacity-60 my-1" />
                        <p className="text-white text-[8px] leading-snug opacity-90">📞 {overlay.telefono}</p>
                        <p className="text-white text-[8px] leading-snug opacity-90">📍 {overlay.domicilio}, San Luis</p>
                      </div>
                    </div>
                  </div>

                  {/* Campos editables del overlay */}
                  {editandoOverlay && (
                    <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground">Editar texto del flyer</p>
                      <div className="space-y-1.5">
                        <input
                          className="w-full text-xs border border-input rounded px-2 py-1 bg-background"
                          placeholder="Título"
                          value={overlay.titulo}
                          onChange={e => setOverlay(o => ({ ...o, titulo: e.target.value }))}
                        />
                        <input
                          className="w-full text-xs border border-input rounded px-2 py-1 bg-background"
                          placeholder="Subtítulo / Servicio"
                          value={overlay.subtitulo}
                          onChange={e => setOverlay(o => ({ ...o, subtitulo: e.target.value }))}
                        />
                        <input
                          className="w-full text-xs border border-input rounded px-2 py-1 bg-background"
                          placeholder="Teléfono"
                          value={overlay.telefono}
                          onChange={e => setOverlay(o => ({ ...o, telefono: e.target.value }))}
                        />
                        <input
                          className="w-full text-xs border border-input rounded px-2 py-1 bg-background"
                          placeholder="Domicilio"
                          value={overlay.domicilio}
                          onChange={e => setOverlay(o => ({ ...o, domicilio: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleGenerarFormato(formato.id)}
                      disabled={generando[formato.id]}
                    >
                      {generando[formato.id] ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando...</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" /> {imagenes[formato.id] ? "Regenerar" : "Generar"}</>
                      )}
                    </Button>
                    {imagenes[formato.id] && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleDescargar(imagenes[formato.id], formato.id)}
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Texto de promoción */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Texto para publicar</p>
                  <Textarea
                    value={textos[formato.id]}
                    onChange={e => setTextos(prev => ({ ...prev, [formato.id]: e.target.value }))}
                    rows={10}
                    className="text-xs resize-none font-mono"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 flex-1"
                      onClick={() => handleCorregirTexto(formato.id)}
                      disabled={corrigiendo[formato.id]}
                    >
                      {corrigiendo[formato.id] ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Corrigiendo...</>
                      ) : (
                        <><SpellCheck className="w-3.5 h-3.5" /> Corregir</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 flex-1"
                      onClick={() => handleCopiarTexto(formato.id)}
                    >
                      {copiado === formato.id ? (
                        <><Check className="w-3.5 h-3.5 text-green-500" /> ¡Copiado!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copiar</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}