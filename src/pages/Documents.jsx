import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, FileText, Download, Pencil, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const docTypeLabels = {
  escrito: "Escrito", carta_documento: "Carta Documento", contrato: "Contrato",
  demanda: "Demanda", contestacion: "Contestación", recurso: "Recurso",
  dictamen: "Dictamen", nota: "Nota", otro: "Otro"
};

const statusLabels = { borrador: "Borrador", en_revision: "En revisión", finalizado: "Finalizado" };

export default function Documents() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", document_type: "escrito", status: "borrador" });
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => base44.entities.Document.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents"] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Document.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm({ title: "", document_type: "escrito", status: "borrador" }); };

  const openEdit = (doc) => { setEditing(doc); setForm({ ...doc }); setDialogOpen(true); };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, file_url }));
    setUploading(false);
  };

  const handleSubmit = () => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = documents.filter(d => {
    const matchSearch = d.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.document_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Documentos</h1>
          <p className="text-muted-foreground mt-1">Biblioteca de documentos del estudio</p>
        </div>
        <Button onClick={() => { setForm({ title: "", document_type: "escrito", status: "borrador" }); setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Documento
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar documentos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(docTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground mt-4">No se encontraron documentos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <Card key={doc.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{doc.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{docTypeLabels[doc.document_type] || doc.document_type}</p>
                    </div>
                  </div>
                  <Badge variant={doc.status === "finalizado" ? "default" : "secondary"} className="text-xs">
                    {statusLabels[doc.status]}
                  </Badge>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {doc.created_date && format(new Date(doc.created_date), "d MMM yyyy", { locale: es })}
                </div>
                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" onClick={() => openEdit(doc)} className="gap-1 text-xs">
                    <Pencil className="w-3 h-3" /> Editar
                  </Button>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="text-xs"><Download className="w-3 h-3" /></Button>
                    </a>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive text-xs" onClick={() => deleteMutation.mutate(doc.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Editar Documento" : "Nuevo Documento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={form.document_type} onValueChange={v => setForm({ ...form, document_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(docTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Adjuntar Archivo</Label>
              <Input type="file" onChange={handleFileUpload} disabled={uploading} />
              {uploading && <p className="text-xs text-muted-foreground">Subiendo archivo...</p>}
              {form.file_url && <p className="text-xs text-green-600">Archivo adjunto ✓</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.title}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}