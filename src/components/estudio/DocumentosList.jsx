import { useState, useRef, useEffect } from "react";
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
import { Plus, Trash2, FileText, Image, Upload, Loader2, Eye, EyeOff, Pencil, Files, Mic } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { prepareFileForUpload } from "@/lib/fileProcessing";
import { invokeLLM } from "@/lib/llm";
import { subscribeBulkUpload, startBulkUpload, getBulkUploadState, PROMPT_TRANSCRIPCION } from "@/lib/bulkUploadManager";

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
  const [transcribiendoAudio, setTranscribiendoAudio] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(null);
  const [bulkUploadState, setBulkUploadState] = useState(getBulkUploadState());
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const bulkInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => subscribeBulkUpload(setBulkUploadState), []);

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
    setConversionProgress(null);
    try {
      const parts = await prepareFileForUpload(file, (current, total) =>
        setConversionProgress({ current, total })
      );
      const nombreBase = file.name.replace(/\.[^/.]+$/, "");
      const tipo = file.type.includes("image") ? "imagen" : file.type.includes("pdf") ? "pdf" : "otro";

      // Subir todas las partes
      const uploaded = [];
      for (const part of parts) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: part });
        uploaded.push(file_url);
      }

      // La primera parte va al formulario
      setForm(prev => ({
        ...prev,
        file_url: uploaded[0],
        tipo_documento: tipo,
        titulo: prev.titulo || (parts.length > 1 ? `${nombreBase} - Parte 1` : prev.titulo),
      }));

      // Si se dividió en varias partes, crear documentos para las restantes
      if (uploaded.length > 1) {
        for (let i = 1; i < uploaded.length; i++) {
          await base44.entities.CasoDocumento.create({
            caso_id: caso.id,
            titulo: `${nombreBase} - Parte ${i + 1}`,
            tipo_documento: tipo,
            file_url: uploaded[i],
            contenido_texto: "",
            fuente: "",
            fecha_documento: "",
            notas: `Parte ${i + 1} de ${uploaded.length} (división automática)`,
            orden: i,
          });
        }
        invalidate();
        toast({ title: "PDF dividido automáticamente", description: `Se dividió en ${uploaded.length} partes y se subieron todas.`, variant: "default" });
      }
    } catch (err) {
      toast({ title: "Error al subir el archivo", description: err?.message || "Intentá nuevamente.", variant: "destructive" });
    } finally {
      setUploading(false);
      setConversionProgress(null);
      e.target.value = "";
    }
  };

  const handleBulkUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    startBulkUpload(files, caso.id);
    e.target.value = "";
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const nombreBase = file.name.replace(/\.[^/.]+$/, "");
    setTranscribiendoAudio(true);

    try {
      // 1. Subir el audio
      const { file_url: audioUrl } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, file_url: audioUrl, tipo_documento: "testimonio" }));

      // 2. Transcribir con Whisper (TranscribeAudio)
      const transcripcion = await base44.integrations.Core.TranscribeAudio({ audio_url: audioUrl });

      // 3. Guardar texto (si es muy largo, subir como .txt)
      let textoGuardar = transcripcion;
      if (transcripcion && transcripcion.length > 8000) {
        const blob = new Blob([transcripcion], { type: "text/plain" });
        const txtFile = new File([blob], `${nombreBase}.txt`, { type: "text/plain" });
        const { file_url: txt_url } = await base44.integrations.Core.UploadFile({ file: txtFile });
        textoGuardar = txt_url;
      }

      setForm(prev => ({
        ...prev,
        contenido_texto: textoGuardar,
        titulo: prev.titulo || nombreBase,
      }));
    } catch (err) {
      toast({ title: "Error con el audio", description: err?.message || "Intentá nuevamente.", variant: "destructive" });
    } finally {
      setTranscribiendoAudio(false);
      e.target.value = "";
    }
  };

  const handleTranscribir = async () => {
    if (!form.file_url) return;
    setTranscribiendo(true);
    try {
      // invokeLLM usa Base44 (Claude) y, si el archivo supera el límite de
      // procesamiento de 10 MB, cae automáticamente a geminiLLM (hasta ~20 MB).
      const resultado = await invokeLLM({
        prompt: PROMPT_TRANSCRIPCION,
        file_urls: [form.file_url],
        model: "claude_sonnet_4_6",
      });

      // Extraer título sugerido si lo hay
      const lines = String(resultado).split("\n");
      const tituloLine = lines.findLast(l => l.trim().startsWith("TÍTULO SUGERIDO:"));
      let textoFinal = resultado;
      let tituloSugerido = null;
      if (tituloLine) {
        tituloSugerido = tituloLine.replace("TÍTULO SUGERIDO:", "").trim();
        textoFinal = lines.filter(l => !l.trim().startsWith("TÍTULO SUGERIDO:")).join("\n").trim();
      }

      // Subir texto si es muy largo
      let textoGuardar = textoFinal;
      if (textoFinal && textoFinal.length > 8000) {
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
    } catch (err) {
      toast({ title: "Error al transcribir", description: err?.message || "Intentá nuevamente.", variant: "destructive" });
    } finally {
      setTranscribiendo(false);
    }
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
            disabled={uploading || bulkUploadState.uploading}
          >
            {bulkUploadState.uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Files className="w-4 h-4" />}
            {bulkUploadState.uploading ? `${bulkUploadState.bulkProgress.current}/${bulkUploadState.bulkProgress.total}` : "Subir y transcribir varios"}
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

      {/* Progreso de carga masiva (continúa aunque navegues a otra sección) */}
      {bulkUploadState.uploading && bulkUploadState.bulkProgress.total > 0 && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-primary text-xs">Procesando {bulkUploadState.bulkProgress.current} de {bulkUploadState.bulkProgress.total} archivos</p>
            <p className="text-xs text-muted-foreground truncate">{bulkUploadState.bulkProgress.step}</p>
          </div>
          <div className="shrink-0 text-xs text-muted-foreground">
            {Math.round((bulkUploadState.bulkProgress.current / bulkUploadState.bulkProgress.total) * 100)}%
          </div>
        </div>
      )}

      {/* Conversión a blanco y negro de PDF grande */}
      {(conversionProgress || bulkUploadState.conversionProgress) && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-amber-900 text-xs">
              Convirtiendo PDF a blanco y negro para reducir tamaño
            </p>
            <p className="text-xs text-amber-700 truncate">
              {(conversionProgress || bulkUploadState.conversionProgress).name ? `${(conversionProgress || bulkUploadState.conversionProgress).name} — ` : ""}página {(conversionProgress || bulkUploadState.conversionProgress).current} de {(conversionProgress || bulkUploadState.conversionProgress).total}
            </p>
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
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading || transcribiendoAudio}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Subiendo..." : "Subir archivo"}
                </Button>
                {form.file_url && !transcribiendoAudio && (
                  <Button type="button" variant="outline" size="sm" className="gap-2 text-primary" onClick={handleTranscribir} disabled={transcribiendo}>
                    {transcribiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    {transcribiendo ? "Transcribiendo..." : "Transcribir con IA"}
                  </Button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
              </div>
              {conversionProgress && (
                <p className="text-xs text-primary animate-pulse">
                  Convirtiendo PDF a blanco y negro para reducir tamaño... página {conversionProgress.current} de {conversionProgress.total}
                </p>
              )}
              {form.file_url && (
                <p className="text-xs text-green-600">✓ Archivo cargado</p>
              )}
            </div>

            {/* Upload AUDIO */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-muted-foreground" /> Audio (transcripción automática)
              </Label>
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => audioInputRef.current?.click()}
                  disabled={transcribiendoAudio || uploading}
                >
                  {transcribiendoAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                  {transcribiendoAudio ? "Transcribiendo audio..." : "Subir audio y transcribir"}
                </Button>
                <input ref={audioInputRef} type="file" accept="audio/*,.mp3,.mp4,.wav,.m4a,.ogg,.webm" className="hidden" onChange={handleAudioUpload} />
                {transcribiendoAudio && (
                  <p className="text-xs text-primary animate-pulse">Procesando audio con IA, puede tardar unos segundos...</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Soporta MP3, MP4, WAV, M4A, OGG — declara​ciones, testigos, audiencias</p>
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