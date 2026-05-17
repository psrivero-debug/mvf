export function buildBasePromptContext(form, formato) {
  const estiloMap = {
    professional: "professional, elegant, dark navy blue and gold color scheme, law firm aesthetic, clean typography",
    modern: "modern, dynamic, sleek design, blue and white tones, contemporary law firm branding",
    minimal: "minimalist, clean white space, thin elegant fonts, subtle gold accents, sophisticated",
    bold: "bold, high contrast, impactful, strong typography, deep dark background with bright gold highlights",
  };

  const orientaciones = {
    post: "cuadrado 1:1, publicación de feed de Instagram/Facebook",
    historia: "vertical 9:16, historia de Instagram/Facebook",
    video: "vertical 9:16, portada para Reels o TikTok, estética cinematográfica",
    banner: "horizontal 16:9, portada de Facebook o LinkedIn",
  };

  return {
    estilo: estiloMap[form.estilo] || estiloMap["professional"],
    layout: orientaciones[formato] || orientaciones["post"],
    formato,
  };
}

// Prompt básico de respaldo si falla el LLM
export function buildFallbackPrompt(form, formato) {
  const { estilo, layout } = buildBasePromptContext(form, formato);
  return `Create a professional legal services promotional image for "${form.titulo}" — a law firm called "Pérez & Funes Estudio Jurídico". 

Service being promoted: ${form.servicio}
${form.descripcion ? `Key message: ${form.descripcion}` : ""}

Design style: ${estilo}
Layout format: ${layout}
Include firm name "Pérez & Funes Estudio Jurídico", phone number "${form.telefono || "2664 169108"}", address "${form.domicilio || "25 de Mayo N° 477"}"
Include scales of justice imagery or legal symbols. Clear text hierarchy. "Consultá hoy" call to action.
High quality advertising design. No real people, focus on design elements and typography.`;
}