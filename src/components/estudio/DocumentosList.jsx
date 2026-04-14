import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileText, Image, Upload, Loader2, Eye, EyeOff, Pencil, Files } from "lucide-react";

const tipoDocLabels = {
  escrito: "Escrito", sentencia: "Sentencia", pericia: "Pericia",
  testimonio: "Testimonio", contrato: "Contrato", imagen: "Imagen", pdf: "PDF", otro: "Otro",
};

const tipoDocColors = {
  escrito: "bg-blue-100 text-blue-700",
  sentencia: "bg-purple-100 text-purple-700",
  pericia: "bg-orange-100 text-orange-700",
  testimonio: "bg-yellow-100 text-yellow-700",
  contrato: "bg-green-100 text-green-700",
  imagen: "bg-pink-100 text-pink-700",
  pdf: "bg-red-100 text-red-700",
  otro: "bg-gray-100 text-gray-700",
};

const emptyDoc = {
  titulo: "", tipo_documento: "escrito", contenido_texto: "",
  file_url: "", fuente: "", fecha_documento: "", notas: "",
};

export default function DocumentosList({ caso, documentos }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyDoc);
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [transcribiendo, setTranscribiendo] = useState(false);
  const fileInputRef = useRef(null);
  const bulkInputRef = useRef(null);
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["caso_documentos", caso.id] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CasoDocumento.create(data),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CasoDocumento.update(id, data),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CasoDocumento.delete(id),
    onSuccess: invalidate,
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyDoc); };

  const openEdit = (doc) => { setEditing(doc); setForm({ ...emptyDoc, ...doc }); setDialogOpen(true); };

  const handleSubmit = () => {
    const data = { ...form, caso_id: caso.id };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({
      ...prev,
      file_url,
      tipo_documento: file.type.includes("image") ? "imagen" : file.type.includes("pdf") ? "pdf" : prev.tipo_documento,
    }));
    setUploading(false);
    e.target.value = "";
  };

  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, step: "" });

  const handleBulkUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setBulkProgress({ current: 0, total: files.length, step: "" });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const nombreBase = file.name.replace(/\.[^/.]+$/, "");
      const tipo = file.type.includes("image") ? "imagen" : file.type.includes("pdf") ? "pdf" : "otro";

      // 1. Subir archivo
      setBulkProgress({ current: i + 1, total: files.length, step: `Subiendo ${file.name}...` });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // 2. Transcribir con IA
      setBulkProgress({ current: i + 1, total: files.length, step: `Transcribiendo ${file.name}...` });
      let contenido_texto = "";
      let titulo = nombreBase;
      try {
        const resultado = await base44.integrations.Core.InvokeLLM({
          prompt: PROMPT_TRANSCRIPCION,
          file_urls: [file_url],
          model: "claude_sonnet_4_6",
        });
        const lines = resultado.split("\n");
        const tituloLine = lines.findLast(l => l.trim().startsWith("TÍTULO SUGERIDO:"));
        if (tituloLine) {
          titulo = tituloLine.replace("TÍTULO SUGERIDO:", "").trim() || nombreBase;
          contenido_texto = lines.filter(l => !l.trim().startsWith("TÍTULO SUGERIDO:")).join("\n").trim();
        } else {
          contenido_texto = resultado;
        }
      } catch {
        contenido_texto = "";
      }

      // 3. Subir texto si es muy largo
      if (contenido_texto && contenido_texto.length > 50000) {
        const blob = new Blob([contenido_texto], { type: "text/plain" });
        const txtFile = new File([blob], `doc_${Date.now()}.txt`, { type: "text/plain" });
        const { file_url: txt_url } = await base44.integrations.Core.UploadFile({ file: txtFile });
        contenido_texto = txt_url;
      }

      // 4. Guardar documento
      await base44.entities.CasoDocumento.create({
        caso_id: caso.id,
        titulo,
        tipo_documento: tipo,
        file_url,
        contenido_texto,
        fuente: "",
        fecha_documento: "",
        notas: "",
        orden: i,
      });
    }

    invalidate();
    setUploading(false);
    setBulkProgress({ current: 0, total: 0, step: "" });
    e.target.value = "";
  };

  const PROMPT_TRANSCRIPCION = `Sos un transcriptor experto en documentos jurídicos argentinos escaneados.
Tu tarea es transcribir el contenido de esta imagen con la máxima fidelidad posible.

INSTRUCCIONES ESTRICTAS:
- Transcribí CADA PALABRA visible, incluyendo encabezados, sellos, firmas (indicalas como "[FIRMA]"), foliatura, numeraciones y fechas.
- Mantené la estructura original: párrafos, sangrías, listas numeradas, bullet points.
- Si hay texto manuscrito, transcribilo entre [MANUSCRITO: ...].
- Si hay sellos o membretes, transcribilos entre [SELLO: ...].
- Respetá mayúsculas, puntuación y acentos tal como aparecen.
- NO resumas, NO omitas nada. Transcribí TODO el texto visible de principio a fin.
- Al final, en una línea separada, escribí: TÍTULO SUGERIDO: [un título descriptivo conciso del documento, máximo 8 palabras].

Devolvé ÚNICAMENTE la transcripción completa (con el título sugerido al final), sin comentarios ni aclaraciones previas.`;

  const handleTranscribir = async () => {
    if (!form.file_url) return;
    setTranscribiendo(true);
    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: PROMPT_TRANSCRIPCION,
      file_urls: [form.file_url],
      model: "claude_sonnet_4_6",
    });

    // Extraer título sugerido si lo hay
    const lines = resultado.split("\n");
    const tituloLine = lines.findLast(l => l.trim().startsWith("TÍTULO SUGERIDO:"));
    let textoFinal = resultado;
    let tituloSugerido = null;
    if (tituloLine) {
      tituloSugerido = tituloLine.replace("TÍTULO SUGERIDO:", "").trim();
      textoFinal = lines.filter(l => !l.trim().startsWith("TÍTULO SUGERIDO:")).join("\n").trim();
    }

    // Subir texto si es muy largo
    let textoGuardar = textoFinal;
    if (textoFinal && textoFinal.length > 50000) {
      const blob = new Blob([textoFinal], { type: "text/plain" });
      const txtFile = new File([blob], `doc_${Date.now()}.txt`, { type: "text/plain" });
      const { file_url: txt_url } = await base44.integrations.Core.UploadFile({ file: txtFile });
      textoGuardar = txt_url;
    }

    setForm(prev => ({
      ...prev,
      contenido_texto: textoGuardar,
      titulo: prev.titulo || tituloSugerido || prev.titulo,
    }));
    setTranscribiendo(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">{documentos.length} documento{documentos.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => bulkInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Files className="w-4 h-4" />}
            {uploading ? `${bulkProgress.current}/${bulkProgress.total}` : "Subir y transcribir varios"}
          </Button>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Agregar Documento
          </Button>
        </div>
        <input
          ref={bulkInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          onChange={handleBulkUpload}
        />
      </div>

      {/* Progreso de carga masiva */}
      {uploading && bulkProgress.total > 0 && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-primary text-xs">Procesando {bulkProgress.current} de {bulkProgress.total} archivos</p>
            <p className="text-xs text-muted-foreground truncate">{bulkProgress.step}</p>
          </div>
          <div className="shrink-0 text-xs text-muted-foreground">
            {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
          </div>
        </div>
      )}

      {documentos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No hay documentos. Agregá el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documentos.map((doc) => (
            <Card key={doc.id} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge className={tipoDocColors[doc.tipo_documento]} variant="secondary">
                        {tipoDocLabels[doc.tipo_documento]}
                      </Badge>
                      <span className="font-medium text-sm">{doc.titulo}</span>
                      {doc.fecha_documento && (
                        <span className="text-xs text-muted-foreground">{doc.fecha_documento}</span>
                      )}
                    </div>
                    {doc.fuente && <p className="text-xs text-muted-foreground">Fuente: {doc.fuente}</p>}
                    {doc.notas && <p className="text-xs text-muted-foreground italic mt-0.5">{doc.notas}</p>}

                    {doc.contenido_texto && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {expandedId === doc.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {expandedId === doc.id ? "Ocultar texto" : "Ver texto completo"}
                        </button>
                        {expandedId === doc.id && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-64 overflow-y-auto border">
                            {doc.contenido_texto}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {doc.file_url && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openEdit(doc)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(doc.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Documento" : "Agregar Documento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Título *</Label>
                <Input placeholder="Ej: Contrato de locación" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={form.tipo_documento} onValueChange={v => setForm({ ...form, tipo_documento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoDocLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Fuente / Origen</Label>
                <Input placeholder="Ej: Juzgado Civil Nº1 San Luis" value={form.fuente} onChange={e => setForm({ ...form, fuente: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Fecha del documento</Label>
                <Input type="date" value={form.fecha_documento} onChange={e => setForm({ ...form, fecha_documento: e.target.value })} />
              </div>
            </div>

            {/* Upload archivo */}
            <div className="grid gap-2">
              <Label>Archivo (imagen/PDF)</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Subiendo..." : "Subir archivo"}
                </Button>
                {form.file_url && (
                  <Button type="button" variant="outline" size="sm" className="gap-2 text-primary" onClick={handleTranscribir} disabled={transcribiendo}>
                    {transcribiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    {transcribiendo ? "Transcribiendo..." : "Transcribir y nombrar con IA"}
                  </Button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
              </div>
              {form.file_url && (
                <p className="text-xs text-green-600">✓ Archivo cargado</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Texto del documento</Label>
              <Textarea
                placeholder="Ingresá o pegá el texto del documento (o transcribí automáticamente con IA)..."
                value={form.contenido_texto}
                onChange={e => setForm({ ...form, contenido_texto: e.target.value })}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label>Notas internas</Label>
              <Input placeholder="Observaciones sobre este documento..." value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.titulo}>
              {editing ? "Guardar Cambios" : "Agregar Documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}