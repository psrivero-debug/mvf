export function buildPrompt(form, formato) {
  const estiloMap = {
    professional: "professional, elegant, dark navy blue and gold color scheme, law firm aesthetic, clean typography",
    modern: "modern, dynamic, sleek design, blue and white tones, contemporary law firm branding",
    minimal: "minimalist, clean white space, thin elegant fonts, subtle gold accents, sophisticated",
    bold: "bold, high contrast, impactful, strong typography, deep dark background with bright gold highlights",
  };
  const estilo = estiloMap[form.estilo] || estiloMap["professional"];

  const orientaciones = {
    post: "square 1:1 ratio social media post",
    historia: "vertical 9:16 ratio Instagram/Facebook story",
    video: "vertical 9:16 ratio social media video thumbnail/cover frame, cinematic quality",
    banner: "horizontal 16:9 ratio banner or Facebook cover",
  };

  const layout = orientaciones[formato] || orientaciones["post"];

  return `Create a professional legal services promotional image for "${form.titulo}" — a law firm called "Pérez & Funes Estudio Jurídico". 

Service being promoted: ${form.servicio}
${form.descripcion ? `Key message: ${form.descripcion}` : ""}

Design style: ${estilo}
Layout format: ${layout}
Include firm name "Pérez & Funes Estudio Jurídico", phone number "${form.telefono || "2664 169108"}", address "${form.domicilio || "25 de Mayo N° 477"}"
Include scales of justice imagery or legal symbols. Clear text hierarchy. "Consultá hoy" call to action.
High quality advertising design. No real people, focus on design elements and typography.`;
}