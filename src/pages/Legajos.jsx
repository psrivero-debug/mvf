import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { subirArchivoPrivado, urlFirmada, useUrlsFirmadas } from "@/lib/privateFiles";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Trash2, FolderOpen, Upload, User, Image, Eye, X, Loader2 } from "lucide-react";

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

export default function Legajos() {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDrop, setShowClientDrop] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewFirmada, setPreviewFirmada] = useState(null);
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: legajos = [], isLoading } = useQuery({
    queryKey: ["legajos"],
    queryFn: () => base44.entities.Legajo.list("-created_date"),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("full_name"),
  });

  const urls = useUrlsFirmadas(legajos.map(l => l.file_url));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Legajo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legajos"] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Legajo.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["legajos"] }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setForm(emptyForm);
    setSelectedClient(null);
    setClientSearch("");
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const uri = await subirArchivoPrivado(file);
    setForm(prev => ({ ...prev, file_url: uri }));
    setPreviewFirmada(await urlFirmada(uri));
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!selectedClient || !form.titulo || !form.file_url) return;
    createMutation.mutate({
      ...form,
      client_id: selectedClient.id,
      client_name: selectedClient.full_name,
      numero_legajo: selectedClient.numero_legajo || "",
    });
  };

  const filteredClients = clients.filter(c =>
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Agrupar legajos por cliente
  const clientsWithLegajos = clients.filter(c =>
    legajos.some(l => l.client_id === c.id)
  );

  const filtered = legajos.filter(l => {
    const matchSearch = l.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      l.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchClient = !clientFilter || l.client_id === clientFilter;
    return matchSearch && matchClient;
  });

  // Agrupar por cliente para la vista
  const grouped = {};
  filtered.forEach(l => {
    if (!grouped[l.client_id]) {
      grouped[l.client_id] = {
        client_name: l.client_name,
        numero_legajo: l.numero_legajo,
        docs: [],
      };
    }
    grouped[l.client_id].docs.push(l);
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Legajos</h1>
          <p className="text-muted-foreground mt-1">Documentos de vital importancia por cliente</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar Documento
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Todos los clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Todos los clientes</SelectItem>
            {clientsWithLegajos.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <FolderOpen className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">No hay documentos en legajos</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Agregá el primero con el botón de arriba</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([clientId, group]) => (
            <div key={clientId}>
              {/* Cabecera del cliente */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {group.client_name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-base">{group.client_name}</h2>
                  {group.numero_legajo && (
                    <span className="text-xs text-muted-foreground font-mono">Legajo Nº {group.numero_legajo}</span>
                  )}
                </div>
                <Badge variant="secondary" className="ml-auto">{group.docs.length} doc{group.docs.length !== 1 ? "s" : ""}</Badge>
              </div>

              {/* Grid de documentos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {group.docs.map(doc => (
                  <div key={doc.id} className="group relative border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-all">
                    {/* Imagen */}
                    <div
                      className="aspect-[3/4] bg-muted/40 cursor-pointer overflow-hidden"
                      onClick={() => setPreviewUrl(urls[doc.file_url] || doc.file_url)}
                    >
                      {doc.file_url ? (
                        <img
                          src={urls[doc.file_url] || doc.file_url}
                          alt={doc.titulo}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* Overlay con acciones */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow"
                          onClick={(e) => { e.stopPropagation(); setPreviewUrl(urls[doc.file_url] || doc.file_url); }}
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
                    {/* Info */}
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
            </div>
          ))}
        </div>
      )}

      {/* Modal vista previa */}
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

      {/* Dialog agregar documento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <FolderOpen className="w-5 h-5" /> Agregar Documento al Legajo
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Cliente */}
            <div className="grid gap-2">
              <Label>Cliente <span className="text-destructive">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setSelectedClient(null); setShowClientDrop(true); }}
                  onFocus={() => setShowClientDrop(true)}
                  onBlur={() => setTimeout(() => setShowClientDrop(false), 150)}
                  className="pl-9"
                />
                {showClientDrop && filteredClients.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-44 overflow-y-auto">
                    {filteredClients.map(c => (
                      <button key={c.id} type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                        onMouseDown={() => {
                          setClientSearch(c.full_name);
                          setSelectedClient(c);
                          setShowClientDrop(false);
                        }}>
                        <span className="font-medium">{c.full_name}</span>
                        {c.numero_legajo && <span className="ml-2 text-xs text-muted-foreground font-mono">Leg. {c.numero_legajo}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedClient?.numero_legajo && (
                <p className="text-xs text-primary font-mono">Legajo Nº {selectedClient.numero_legajo}</p>
              )}
            </div>

            {/* Título */}
            <div className="grid gap-2">
              <Label>Título del documento <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ej: DNI frente, Acta de nacimiento..."
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
              />
            </div>

            {/* Tipo */}
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

            {/* Upload imagen */}
            <div className="grid gap-2">
              <Label>Imagen del documento <span className="text-destructive">*</span></Label>
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
                  className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">Hacé clic para subir imagen o PDF</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, PDF</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border">
                  <img src={previewFirmada} alt="Vista previa" className="w-full max-h-48 object-contain bg-muted/20" />
                  <button
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"
                    onClick={() => { setPreviewFirmada(null); setForm({ ...form, file_url: "" }); }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Notas */}
            <div className="grid gap-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Observaciones sobre el documento..."
                value={form.notas}
                onChange={e => setForm({ ...form, notas: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedClient || !form.titulo || !form.file_url || createMutation.isPending}
            >
              {createMutation.isPending ? "Guardando..." : "Guardar Documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}