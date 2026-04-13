import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, File } from "lucide-react";
import { jsPDF } from "jspdf";

function markdownToPlainText(md) {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/gs, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function exportarPDF({ caso, documentos, analisis }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margen = 20;
  const anchoUtil = 170;
  let y = margen;

  const addText = (text, size = 10, bold = false, color = [30, 30, 30]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, anchoUtil);
    lines.forEach(line => {
      if (y > 270) { doc.addPage(); y = margen; }
      doc.text(line, margen, y);
      y += size * 0.45;
    });
    y += 2;
  };

  const addSeparator = () => {
    if (y > 270) { doc.addPage(); y = margen; }
    doc.setDrawColor(200, 200, 200);
    doc.line(margen, y, margen + anchoUtil, y);
    y += 4;
  };

  // Encabezado
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ESTUDIO DE CASO JURÍDICO", margen, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Pérez & Funes · Estudio Jurídico · San Luis, Argentina", margen, 21);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 150, 21);
  y = 40;

  // Carátula
  addText(caso.titulo, 14, true);
  if (caso.numero_expediente) addText(`Expediente: ${caso.numero_expediente}`, 10, false, [80, 80, 80]);
  if (caso.tipo_caso) addText(`Tipo: ${caso.tipo_caso.toUpperCase()}`, 10, false, [80, 80, 80]);
  if (caso.client_name) addText(`Cliente: ${caso.client_name}`, 10, false, [80, 80, 80]);
  if (caso.jurisdiccion) addText(`Jurisdicción: ${caso.jurisdiccion}`, 10, false, [80, 80, 80]);
  if (caso.partes) addText(`Partes: ${caso.partes}`, 10, false, [80, 80, 80]);
  if (caso.descripcion) { y += 2; addText(caso.descripcion, 10); }

  // Documentos
  if (documentos.length > 0) {
    y += 4;
    addSeparator();
    addText(`DOCUMENTOS DEL CASO (${documentos.length})`, 12, true, [30, 58, 95]);
    y += 2;
    documentos.forEach((d, i) => {
      addText(`${i + 1}. ${d.titulo}`, 10, true);
      if (d.tipo_documento) addText(`   Tipo: ${d.tipo_documento} · Fuente: ${d.fuente || "—"} · Fecha: ${d.fecha_documento || "—"}`, 9, false, [100, 100, 100]);
      if (d.contenido_texto) {
        addText(markdownToPlainText(d.contenido_texto), 9, false, [50, 50, 50]);
      }
      if (d.notas) addText(`   Nota: ${d.notas}`, 9, false, [120, 120, 120]);
      y += 2;
    });
  }

  // Análisis IA
  if (analisis.length > 0) {
    y += 4;
    addSeparator();
    addText(`ANÁLISIS DE AGENTES IA (${analisis.length})`, 12, true, [30, 58, 95]);
    y += 2;
    const etiquetas = { lector_juridico: "Lector Jurídico", abogado_defensor: "Abogado Defensor", analista: "Analista Jurídico", transcriptor: "Transcriptor/Redactor" };
    analisis.forEach((a, i) => {
      addText(`${i + 1}. ${etiquetas[a.agente] || a.agente}`, 10, true);
      addText(`Consulta: ${a.consulta}`, 9, false, [80, 80, 80]);
      if (a.respuesta) addText(markdownToPlainText(a.respuesta), 9, false, [50, 50, 50]);
      y += 3;
    });
  }

  // Pie
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${totalPages} · Pérez & Funes · Estudio Jurídico San Luis`, margen, 290);
  }

  doc.save(`caso_${caso.titulo.replace(/\s+/g, "_")}.pdf`);
}

function exportarWord({ caso, documentos, analisis }) {
  const etiquetas = { lector_juridico: "Lector Jurídico", abogado_defensor: "Abogado Defensor", analista: "Analista Jurídico", transcriptor: "Transcriptor/Redactor" };

  let contenido = `ESTUDIO DE CASO JURÍDICO
Pérez & Funes · Estudio Jurídico · San Luis, Argentina
Generado: ${new Date().toLocaleDateString("es-AR")}

${"=".repeat(60)}
CARÁTULA
${"=".repeat(60)}

Título: ${caso.titulo}
${caso.numero_expediente ? `Expediente: ${caso.numero_expediente}\n` : ""}${caso.tipo_caso ? `Tipo: ${caso.tipo_caso.toUpperCase()}\n` : ""}${caso.client_name ? `Cliente: ${caso.client_name}\n` : ""}${caso.jurisdiccion ? `Jurisdicción: ${caso.jurisdiccion}\n` : ""}${caso.partes ? `Partes: ${caso.partes}\n` : ""}${caso.descripcion ? `\nDescripción:\n${caso.descripcion}\n` : ""}`;

  if (documentos.length > 0) {
    contenido += `\n${"=".repeat(60)}\nDOCUMENTOS DEL CASO (${documentos.length})\n${"=".repeat(60)}\n\n`;
    documentos.forEach((d, i) => {
      contenido += `${i + 1}. ${d.titulo}\n`;
      contenido += `   Tipo: ${d.tipo_documento || "—"} | Fuente: ${d.fuente || "—"} | Fecha: ${d.fecha_documento || "—"}\n`;
      if (d.contenido_texto) contenido += `\n${markdownToPlainText(d.contenido_texto)}\n`;
      if (d.notas) contenido += `\nNota interna: ${d.notas}\n`;
      contenido += `\n${"-".repeat(40)}\n\n`;
    });
  }

  if (analisis.length > 0) {
    contenido += `\n${"=".repeat(60)}\nANÁLISIS DE AGENTES IA (${analisis.length})\n${"=".repeat(60)}\n\n`;
    analisis.forEach((a, i) => {
      contenido += `${i + 1}. ${etiquetas[a.agente] || a.agente}\n`;
      contenido += `Consulta: ${a.consulta}\n\n`;
      if (a.respuesta) contenido += `${markdownToPlainText(a.respuesta)}\n`;
      contenido += `\n${"-".repeat(40)}\n\n`;
    });
  }

  const blob = new Blob(["\ufeff" + contenido], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `caso_${caso.titulo.replace(/\s+/g, "_")}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportarCaso({ caso, documentos = [], analisis = [] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" /> Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportarPDF({ caso, documentos, analisis })} className="gap-2 cursor-pointer">
          <File className="w-4 h-4 text-red-500" /> Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportarWord({ caso, documentos, analisis })} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-blue-500" /> Exportar Word (.doc)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}