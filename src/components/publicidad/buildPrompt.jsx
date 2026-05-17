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
  return `Professional background image for a legal services flyer promoting "${form.servicio}". Law firm aesthetic. ${estilo}. ${layout}. Symbolic legal elements: scales of justice, law books, wooden gavel, documents. No real people. Absolutely no text, no letters, no words, no numbers, no typography anywhere in the image. Pure visual background only. High quality advertising photography.`;
}