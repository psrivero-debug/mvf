import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Trash2, Eye, X, Loader2, FolderOpen, Plus, ImageIcon, Mic, FileText, RefreshCw } from "lucide-react";

const tipoDocLabels = {
  dni: "DNI",
  acta_nacimiento: "Acta de Nacimiento",
  acta_matrimonio: "Acta de Matrimonio",
  acta_defuncion: "Acta de Defunción",
  escritura: "Escritura",
  poder_notarial: "Poder Notarial",
  sentencia: "Sentencia",
  contrato: "Contrato",
  recibo: "Recibo",
  certificado: "Certificado",
  foto: "Fotografía",
  otro: "Otro",
};

const tipoDocColors = {
  dni: "bg-blue-100 text-blue-700",
  acta_nacimiento: "bg-green-100 text-green-700",
  acta_matrimonio: "bg-pink-100 text-pink-700",
  acta_defuncion: "bg-gray-100 text-gray-700",
  escritura: "bg-amber-100 text-amber-700",
  poder_notarial: "bg-purple-100 text-purple-700",
  sentencia: "bg-red-100 text-red-700",
  contrato: "bg-indigo-100 text-indigo-700",
  recibo: "bg-emerald-100 text-emerald-700",
  certificado: "bg-teal-100 text-teal-700",
  foto: "bg-orange-100 text-orange-700",
  otro: "bg-muted text-muted-foreground",
};

const emptyForm = {
  titulo: "",
  tipo_documento: "dni",
  file_url: "",
  notas: "",
  fecha_documento: "",
};

export default function LegajoModal({ client, open, onClose }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [transcribiendoAudio, setTranscribiendoAudio] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileRef = useRef(null);
  const audioRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: legajos = [], isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["legajos", client?.id],
    queryFn: () => base44.entities.Legajo.filter({ client_id: client.id }, "-created_date"),
    enabled: !!client?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Legajo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legajos", client.id] });
      queryClient.invalidateQueries({ queryKey: ["legajos"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Legajo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legajos", client.id] });
      queryClient.invalidateQueries({ queryKey: ["legajos"] });
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const nombreBase = file.name.replace(/\.[^/.]+$/, "");
    setTranscribiendoAudio(true);

    // 1. Subir audio
    const { file_url: audioUrl } = await base44.integrations.Core.UploadFile({ file });

    // 2. Transcribir con Whisper
    let transcripcion = "";
    transcripcion = await base44.integrations.Core.TranscribeAudio({ audio_url: audioUrl });

    // 3. Guardar transcripción como archivo .txt
    const blob = new Blob([transcripcion], { type: "text/plain" });
    const txtFile = new File([blob], `${nombreBase}.txt`, { type: "text/plain" });
    const { file_url: txtUrl } = await base44.integrations.Core.UploadFile({ file: txtFile });

    // 4. Guardar en legajo
    createMutation.mutate({
      titulo: nombreBase,
      tipo_documento: "otro",
      file_url: txtUrl,
      notas: `Transcripción automática de audio: ${file.name}`,
      fecha_documento: new Date().toISOString().split("T")[0],
      client_id: client.id,
      client_name: client.full_name,
      numero_legajo: client.numero_legajo || "",
    });

    setTranscribiendoAudio(false);
    e.target.value = "";
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, file_url }));
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!form.titulo || !form.file_url) return;
    createMutation.mutate({
      ...form,
      client_id: client.id,
      client_name: client.full_name,
      numero_legajo: client.numero_legajo || "",
    });
  };

  if (!client) return null;

  const nombreCliente = client.client_type === "persona_juridica"
    ? client.razon_social || client.full_name
    : `${client.nombre || ""} ${client.apellido || ""}`.trim();

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2 flex-wrap">
              <FolderOpen className="w-5 h-5 text-primary" />
              Legajo — {nombreCliente}
              {client.numero_legajo && (
                <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded ml-1">
                  Nº {client.numero_legajo}
                </span>
              )}
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="ml-auto flex items-center gap-1.5 text-xs font-normal text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border"
                title="Actualizar documentos"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </DialogTitle>
          </DialogHeader>

          {/* Documentos existentes */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : legajos.length === 0 && !showForm ? (
            <div className="py-10 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/25 mb-3" />
              <p className="text-muted-foreground text-sm">Este legajo no tiene documentos aún</p>
            </div>
          ) : (
            legajos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-2">
                {legajos.map(doc => (
                  <div key={doc.id} className="group relative border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-all">
                    <div
                      className="aspect-[3/4] bg-muted/40 cursor-pointer overflow-hidden relative"
                      onClick={() => doc.file_url?.endsWith(".txt") ? window.open(doc.file_url, "_blank") : setPreviewUrl(doc.file_url)}
                    >
                      {doc.file_url?.endsWith(".txt") ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/30">
                          <FileText className="w-10 h-10 text-primary/50" />
                          <span className="text-[10px] text-muted-foreground text-center px-1">Transcripción</span>
                        </div>
                      ) : doc.file_url ? (
                        <img
                          src={doc.file_url}
                          alt={doc.titulo}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow"
                          onClick={(e) => { e.stopPropagation(); doc.file_url?.endsWith(".txt") ? window.open(doc.file_url, "_blank") : setPreviewUrl(doc.file_url); }}
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(doc.id); }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold truncate">{doc.titulo}</p>
                      <Badge className={`text-[10px] mt-1 ${tipoDocColors[doc.tipo_documento] || tipoDocColors.otro}`} variant="secondary">
                        {tipoDocLabels[doc.tipo_documento] || doc.tipo_documento}
                      </Badge>
                      {doc.fecha_documento && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{doc.fecha_documento}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Botones de acción */}
          {!showForm && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> Subir Documento
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => audioRef.current?.click()}
                disabled={transcribiendoAudio}
              >
                {transcribiendoAudio
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Mic className="w-4 h-4 text-primary" />}
                {transcribiendoAudio ? "Transcribiendo audio..." : "Subir Audio y Transcribir"}
              </Button>
              <input
                ref={audioRef}
                type="file"
                accept="audio/*,.mp3,.mp4,.wav,.m4a,.ogg,.webm,.flac"
                className="hidden"
                onChange={handleAudioUpload}
              />
            </div>
          )}
          {transcribiendoAudio && (
            <p className="text-xs text-primary text-center animate-pulse">
              Transcribiendo con IA — el documento se guardará automáticamente en el legajo...
            </p>
          )}

          {/* Última actualización */}
          {dataUpdatedAt > 0 && !showForm && (
            <p className="text-[11px] text-muted-foreground/60 text-center">
              Última actualización: {new Date(dataUpdatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          )}

          {/* Formulario inline */}
          {showForm && (
            <div className="border rounded-xl p-4 space-y-4 bg-muted/10">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Nuevo Documento</p>

              <div className="grid gap-2">
                <Label>Título <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Ej: DNI frente, Acta de nacimiento..."
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo de documento</Label>
                  <Select value={form.tipo_documento} onValueChange={v => setForm({ ...form, tipo_documento: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(tipoDocLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Fecha del documento</Label>
                  <Input
                    type="date"
                    value={form.fecha_documento}
                    onChange={e => setForm({ ...form, fecha_documento: e.target.value })}
                  />
                </div>
              </div>

              {/* Upload */}
              <div className="grid gap-2">
                <Label>Imagen / Archivo <span className="text-destructive">*</span></Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={e => handleFileUpload(e.target.files[0])}
                />
                {!form.file_url ? (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-5 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-7 h-7 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Subiendo...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-7 h-7 mx-auto text-muted-foreground/40 mb-1.5" />
                        <p className="text-sm text-muted-foreground">Hacé clic para subir imagen o PDF</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, PDF</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border">
                    <img src={form.file_url} alt="Vista previa" className="w-full max-h-40 object-contain bg-muted/20" />
                    <button
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"
                      onClick={() => setForm({ ...form, file_url: "" })}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Observaciones..."
                  value={form.notas}
                  onChange={e => setForm({ ...form, notas: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!form.titulo || !form.file_url || createMutation.isPending || uploading}
                >
                  {createMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview imagen */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          <div className="relative">
            <button
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="w-4 h-4" />
            </button>
            {previewUrl && (
              <img src={previewUrl} alt="Vista previa" className="w-full max-h-[80vh] object-contain rounded-lg" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}