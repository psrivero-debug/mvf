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
        prompt: `Sos un experto en diseño gráfico publicitario para estudios jurídicos argentinos.
Generá un prompt detallado en inglés para crear una imagen publicitaria de alta calidad para la firma "Pérez & Funes Estudio Jurídico" de San Luis, Argentina.

Datos del flyer:
- Título: "${formData.titulo}"
- Servicio: "${formData.servicio}"
- Mensaje clave: "${formData.descripcion || "Asesoramiento legal personalizado"}"
- Estilo visual: ${estilo}
- Formato: ${layout}
- Teléfono: ${telefono}
- Domicilio: ${domicilio}

El prompt debe describir:
1. Una imagen de fondo representativa y realista para "${formData.servicio}" (ej: para Derecho de Familia → familia en sala de estar, para Derecho Laboral → personas en oficina, para Inmobiliario → edificios o contratos, etc.)
2. Superposición de elementos gráficos del estudio jurídico
3. Tipografía y texto a incluir
4. Iluminación, composición y paleta de colores acorde al estilo
5. Que NO aparezcan personas reales, sino ambientaciones, objetos o simbolismos
6. CRÍTICO: Cualquier texto en la imagen debe tener ortografía perfecta en español. El título "${formData.titulo}" debe aparecer EXACTAMENTE como está escrito, sin cambiar ninguna letra.

Respondé SOLO con el prompt en inglés, listo para usar en un generador de imágenes. Sin explicaciones adicionales.`,
        response_json_schema: null,
      });
      imagePrompt = typeof llmResult === "string" ? llmResult : String(llmResult);
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
                {/* Imagen */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Imagen</p>
                  <div className={`${formato.aspecto} w-full max-w-[280px] mx-auto bg-muted rounded-xl overflow-hidden border border-border`}>
                    {imagenes[formato.id] ? (
                      <img
                        src={imagenes[formato.id]}
                        alt={formato.label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <formato.icon className="w-8 h-8 opacity-30" />
                        <p className="text-xs">Sin imagen</p>
                      </div>
                    )}
                  </div>

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