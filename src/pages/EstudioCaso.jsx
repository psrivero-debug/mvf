import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, BookOpen, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DetalleCaso from "../components/estudio/DetalleCaso";

const tipoLabels = {
  civil: "Civil", penal: "Penal", laboral: "Laboral", familia: "Familia",
  comercial: "Comercial", administrativo: "Administrativo", inmobiliario: "Inmobiliario", otro: "Otro",
};

const estadoColors = {
  activo: "bg-green-100 text-green-700",
  en_analisis: "bg-blue-100 text-blue-700",
  archivado: "bg-gray-100 text-gray-600",
};

const emptyCaso = {
  titulo: "", descripcion: "", tipo_caso: "civil", client_name: "",
  estado: "activo", jurisdiccion: "", numero_expediente: "", partes: "",
  hechos_resumen: "", notas: "",
};

export default function EstudioCaso() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyCaso);
  const [editing, setEditing] = useState(null);
  const [selectedCaso, setSelectedCaso] = useState(null);
  const queryClient = useQueryClient();

  const { data: casos = [], isLoading } = useQuery({
    queryKey: ["estudio_casos"],
    queryFn: () => base44.entities.EstudioCaso.list("-created_date"),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EstudioCaso.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["estudio_casos"] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EstudioCaso.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["estudio_casos"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EstudioCaso.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["estudio_casos"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyCaso); };

  const openEdit = (c) => { setEditing(c); setForm({ ...emptyCaso, ...c }); setDialogOpen(true); };

  const handleSubmit = () => {
    const selectedClient = clients.find(c => c.id === form.client_id);
    const data = { ...form, client_name: selectedClient?.full_name || form.client_name };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const filtered = casos.filter(c =>
    c.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.numero_expediente?.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedCaso) {
    return <DetalleCaso caso={selectedCaso} onBack={() => setSelectedCaso(null)} />;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Estudio de Caso</h1>
          <p className="text-muted-foreground mt-1">Análisis jurídico profundo con inteligencia artificial · Provincia de San Luis</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Caso
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por título, cliente, expediente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <BookOpen className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">No hay casos de estudio</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Creá un nuevo caso para comenzar el análisis</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Card key={c.id} className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => setSelectedCaso(c)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {c.numero_expediente && (
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">#{c.numero_expediente}</span>
                      )}
                      <h3 className="font-semibold">{c.titulo}</h3>
                      <Badge className={estadoColors[c.estado]} variant="secondary">
                        {c.estado === "en_analisis" ? "En análisis" : c.estado === "activo" ? "Activo" : "Archivado"}
                      </Badge>
                      {c.tipo_caso && <Badge variant="outline" className="text-xs">{tipoLabels[c.tipo_caso]}</Badge>}
                    </div>
                    {c.client_name && <p className="text-sm text-muted-foreground">Cliente: {c.client_name}</p>}
                    {c.descripcion && <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{c.descripcion}</p>}
                    {c.jurisdiccion && <p className="text-xs text-muted-foreground/70 mt-1">{c.jurisdiccion}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={e => { e.stopPropagation(); openEdit(c); }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={e => { e.stopPropagation(); deleteMutation.mutate(c.id); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Editar Caso" : "Nuevo Estudio de Caso"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Título / Carátula *</Label>
              <Input placeholder="Ej: García c/ López s/ daños y perjuicios" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo de Caso</Label>
                <Select value={form.tipo_caso} onValueChange={v => setForm({ ...form, tipo_caso: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="en_analisis">En análisis</SelectItem>
                    <SelectItem value="archivado">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nº de Expediente</Label>
                <Input placeholder="Ej: 12345/2024" value={form.numero_expediente} onChange={e => setForm({ ...form, numero_expediente: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Cliente</Label>
                <Select value={form.client_id || ""} onValueChange={v => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Jurisdicción</Label>
              <Input placeholder="Ej: Juzgado Civil Nº 1 - San Luis" value={form.jurisdiccion} onChange={e => setForm({ ...form, jurisdiccion: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Partes</Label>
              <Input placeholder="Actor: ... / Demandado: ..." value={form.partes} onChange={e => setForm({ ...form, partes: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Descripción / Hechos</Label>
              <Textarea placeholder="Resumen del caso..." value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.titulo}>
              {editing ? "Guardar Cambios" : "Crear Caso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}