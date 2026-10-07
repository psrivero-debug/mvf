import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { invokeLLM } from "@/lib/llm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import mammoth from "mammoth";
import { Plus, Loader2, Upload, FileText, Trash2, Eye, EyeOff, ScanText } from "lucide-react";

const PROMPT_TRANSCRIPCION = `Sos un transcriptor experto en documentos jurídicos argentinos escaneados.
Transcribí TODO el texto visible de esta imagen con la máxima fidelidad: encabezados, sellos (indicalos como [SELLO: ...]), firmas (indicalas como [FIRMA]), manuscritos (entre [MANUSCRITO: ...]), párrafos, sangrías y numeraciones.
NO resumas, NO omitas nada. Devolvé únicamente la transcripción completa, sin comentarios previos.`;

export default function ProyectoDocumentos({ proyecto }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", tipo_documento: "texto", contenido_texto: "" });
  const [subiendo, setSubiendo] = useState(false);
  const [transcribiendoId, setTranscribiendoId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(null);
  const fileInputRef = useRef(null);
  const wordInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: documentos = [] } = useQuery({
    queryKey: ["proyecto_documentos", proyecto.id],
    queryFn: () => base44.entities.ProyectoDocumento.filter({ proyecto_id: proyecto.id }, "created_date"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["proyecto_documentos", proyecto.id] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProyectoDocumento.create(data),
    onSuccess: () => { invalidate(); cerrarDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProyectoDocumento.delete(id),
    onSuccess: invalidate,
  });

  const cerrarDialog = () => { setDialogOpen(false); setForm({ titulo: "", tipo_documento: "texto", contenido_texto: "" }); };

  const guardarTexto = () => {
    if (!form.titulo.trim() || !form.contenido_texto.trim()) return;
    createMutation.mutate({
      proyecto_id: proyecto.id,
      titulo: form.titulo.trim(),
      tipo_documento: "texto",
      contenido_texto: form.contenido_texto,
    });
  };

  const subirImagen = async (file) => {
    const titulo = form.titulo.trim() || file.name.replace(/\.[^/.]+$/, "");
    setSubiendo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const rec = await base44.entities.ProyectoDocumento.create({
        proyecto_id: proyecto.id,
        titulo,
        tipo_documento: "imagen",
        file_url,
      });
      invalidate();
      cerrarDialog();
      // Transcripción automática con IA
      setTranscribiendoId(rec.id);
      try {
        const texto = await invokeLLM({
          prompt: PROMPT_TRANSCRIPCION,
          file_urls: [file_url],
          model: "claude_sonnet_4_6",
        });
        if (texto) {
          await base44.entities.ProyectoDocumento.update(rec.id, { contenido_texto: String(texto) });
          invalidate();
        }
      } catch {
        toast({ title: "Archivo cargado", description: "La imagen quedó guardada pero la transcripción falló. Reintentá desde el botón de transcribir.", variant: "destructive" });
      } finally {
        setTranscribiendoId(null);
      }
    } catch (err) {
      toast({ title: "Error al subir el archivo", description: err?.message || "Intentá nuevamente.", variant: "destructive" });
    } finally {
      setSubiendo(false);
    }
  };

  const subirWord = async (file) => {
    const titulo = form.titulo.trim() || file.name.replace(/\.[^/.]+$/, "");
    setSubiendo(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value: texto } = await mammoth.extractRawText({ arrayBuffer });
      await base44.entities.ProyectoDocumento.create({
        proyecto_id: proyecto.id,
        titulo,
        tipo_documento: "texto",
        contenido_texto: texto,
      });
      invalidate();
      cerrarDialog();
      toast({ title: "Documento Word cargado", description: "Se extrajo el texto correctamente y quedó guardado en el proyecto." });
    } catch (err) {
      toast({ title: "Error al leer el Word", description: err?.message || "Intentá nuevamente.", variant: "destructive" });
    } finally {
      setSubiendo(false);
    }
  };

  const retranscribir = async (doc) => {
    if (!doc.file_url) return;
    setTranscribiendoId(doc.id);
    try {
      const texto = await invokeLLM({
        prompt: PROMPT_TRANSCRIPCION,
        file_urls: [doc.file_url],
        model: "claude_sonnet_4_6",
      });
      if (texto) {
        await base44.entities.ProyectoDocumento.update(doc.id, { contenido_texto: String(texto) });
        invalidate();
      }
    } catch {
      toast({ title: "Error al transcribir", description: "Intentá nuevamente.", variant: "destructive" });
    } finally {
      setTranscribiendoId(null);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" /> Agregar documento
        </Button>
      </div>

      {documentos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No hay documentos en este proyecto. Agregá imágenes, Word o textos para que el consultor los analice.</p>
          <Button size="sm" className="gap-2 mt-3" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" /> Agregar documento
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documentos.map((doc) => (
            <Card key={doc.id} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className={doc.tipo_documento === "imagen" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}>
                        {doc.tipo_documento === "imagen" ? "Imagen" : "Texto"}
                      </Badge>
                      <span className="font-medium text-sm">{doc.titulo}</span>
                    </div>
                    {transcribiendoId === doc.id ? (
                      <p className="flex items-center gap-1.5 text-xs text-primary mt-2">
                        <Loader2 className="w-3 h-3 animate-spin" /> Transcribiendo con IA...
                      </p>
                    ) : doc.contenido_texto ? (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {expandedId === doc.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {expandedId === doc.id ? "Ocultar texto" : "Ver texto"}
                        </button>
                        {expandedId === doc.id && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-64 overflow-y-auto border">
                            {doc.contenido_texto}
                          </div>
                        )}
                      </div>
                    ) : doc.tipo_documento === "imagen" ? (
                      <p className="text-xs text-amber-700 italic mt-2">Sin transcripción todavía</p>
                    ) : null}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {doc.file_url && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" title="Ver archivo original">
                          <ScanText className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    )}
                    {doc.file_url && (
                      <Button size="sm" variant="ghost" onClick={() => retranscribir(doc)} disabled={!!transcribiendoId} title="Re-transcribir con IA">
                        <Loader2 className={`w-3.5 h-3.5 ${transcribiendoId === doc.id ? "animate-spin" : "hidden"}`} />
                        {transcribiendoId !== doc.id && <ScanText className="w-3.5 h-3.5" />}
                      </Button>
                    )}
                    {confirmandoBorrar === doc.id ? (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive border border-destructive/30" onClick={() => deleteMutation.mutate(doc.id)}>
                          Confirmar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-1" onClick={() => setConfirmandoBorrar(null)}>
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmandoBorrar(doc.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar documento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input placeholder="Ej: Escrito de demanda" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={form.tipo_documento} onValueChange={v => setForm({ ...form, tipo_documento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="texto">Texto (pegar o escribir)</SelectItem>
                  <SelectItem value="imagen">Imagen (se transcribe con IA)</SelectItem>
                  <SelectItem value="word">Word .docx (se extrae el texto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.tipo_documento === "texto" ? (
              <div className="grid gap-2">
                <Label>Texto del documento</Label>
                <Textarea
                  placeholder="Pegá o escribí el texto del documento..."
                  value={form.contenido_texto}
                  onChange={e => setForm({ ...form, contenido_texto: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            ) : form.tipo_documento === "imagen" ? (
              <div className="grid gap-2">
                <Label>Archivo de imagen</Label>
                <div className="flex gap-2 items-center">
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={subiendo}>
                    {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {subiendo ? "Subiendo..." : "Subir imagen"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) subirImagen(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">La imagen se sube y se transcribe automáticamente con IA.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Archivo Word (.docx)</Label>
                <div className="flex gap-2 items-center">
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => wordInputRef.current?.click()} disabled={subiendo}>
                    {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {subiendo ? "Procesando..." : "Subir Word"}
                  </Button>
                  <input
                    ref={wordInputRef}
                    type="file"
                    accept=".docx"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) subirWord(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Se extrae el texto del documento y queda guardado en el proyecto.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cerrarDialog}>Cancelar</Button>
            {form.tipo_documento === "texto" && (
              <Button onClick={guardarTexto} disabled={!form.titulo.trim() || !form.contenido_texto.trim() || createMutation.isPending}>
                Guardar documento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}