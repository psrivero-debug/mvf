import { Document, Packer, Paragraph, TextRun } from "docx";

export async function descargarWord(titulo, texto) {
  const parrafos = (texto || "")
    .split("\n")
    .filter(l => l.trim() !== "")
    .map(line => new Paragraph({ children: [new TextRun(line)], spacing: { after: 200 } }));

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ text: titulo || "Documento", bold: true, size: 32 })],
          spacing: { after: 300 },
        }),
        ...parrafos,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(titulo || "documento").replace(/[^\w\s-]/g, "").trim().slice(0, 60) || "documento"}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}