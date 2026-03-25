import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Briefcase, Calendar, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const emptyCase = {
  title: "", client_id: "", client_name: "", case_number: "", jurisdiction: "",
  case_type: "civil", status: "activo", description: "", priority: "media",
  next_deadline: "", notes: ""
};

const statusLabels = { activo: "Activo", en_tramite: "En trámite", sentencia: "Sentencia", apelacion: "Apelación", cerrado: "Cerrado" };
const priorityLabels = { baja: "Baja", media: "Media", alta: "Alta", urgente: "Urgente" };
const typeLabels = { civil: "Civil", penal: "Penal", laboral: "Laboral", familia: "Familia", comercial: "Comercial", administrativo: "Administrativo", otro: "Otro" };

const priorityColors = {
  baja: "bg-muted text-muted-foreground",
  media: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700"
};

export default function Cases() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCase);
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.Case.list("-created_date"),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cases"] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Case.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cases"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Case.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cases"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyCase); };

  const openEdit = (c) => { setEditing(c); setForm({ ...emptyCase, ...c }); setDialogOpen(true); };

  const handleSubmit = () => {
    const selectedClient = clients.find(c => c.id === form.client_id);
    const data = { ...form, client_name: selectedClient?.full_name || form.client_name };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = cases.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.case_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Causas</h1>
          <p className="text-muted-foreground mt-1">Seguimiento de expedientes y causas judiciales</p>
        </div>
        <Button onClick={() => { setForm(emptyCase); setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva Causa
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar causas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground mt-4">No se encontraron causas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Card key={c.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{c.title}</h3>
                      <Badge className={priorityColors[c.priority]} variant="secondary">{priorityLabels[c.priority]}</Badge>
                      <Badge variant="outline">{statusLabels[c.status]}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {c.client_name && <span>{c.client_name}</span>}
                      {c.case_type && <span>· {typeLabels[c.case_type]}</span>}
                      {c.case_number && <span>· Exp. {c.case_number}</span>}
                      {c.jurisdiction && <span>· {c.jurisdiction}</span>}
                    </div>
                    {c.next_deadline && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Vence: {format(new Date(c.next_deadline), "d 'de' MMMM yyyy", { locale: es })}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)} className="gap-1 text-xs">
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive text-xs" onClick={() => deleteMutation.mutate(c.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Editar Causa" : "Nueva Causa"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Carátula / Título *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Cliente *</Label>
                <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Nº Expediente</Label>
                <Input value={form.case_number} onChange={e => setForm({ ...form, case_number: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo de Causa</Label>
                <Select value={form.case_type} onValueChange={v => setForm({ ...form, case_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Prioridad</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Próximo Vencimiento</Label>
                <Input type="date" value={form.next_deadline} onChange={e => setForm({ ...form, next_deadline: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Juzgado / Jurisdicción</Label>
              <Input value={form.jurisdiction} onChange={e => setForm({ ...form, jurisdiction: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.title || !form.client_id}>
              {editing ? "Guardar Cambios" : "Crear Causa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}