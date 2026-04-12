import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";

const tipoLabels = {
  civil: "Civil",
  penal: "Penal",
  laboral: "Laboral",
  familia: "Familia",
  comercial: "Comercial",
  administrativo: "Administrativo",
  inmobiliario: "Inmobiliario",
  otro: "Otro",
};

const requisitosIniciales = {
  civil: ["Escritura original o copia legalizada", "Comprobantes de reclamo previo", "Presupuestos o cotizaciones", "Documentación del contrato en cuestión"],
  penal: ["Denuncia policial o judicial", "Documentación médica (si es relevante)", "Testigos identificados", "Antecedentes penales del denunciado"],
  laboral: ["Recibos de sueldo", "Contrato de trabajo", "Comunicación de despido", "Liquidación final o documentación de aportes"],
  familia: ["Partida de nacimiento/matrimonio/divorcio", "Documentación de patria potestad", "Prueba de ingresos", "Bienes a considerar en división"],
  comercial: ["Escritura constitutiva", "Estatuto social", "Balances contables", "Contratos comerciales relevantes"],
  administrativo: ["Resolución administrativa impugnada", "Solicitudes previas", "Documentación que sustenta la impugnación", "Pruebas de cumplimiento de plazos"],
  inmobiliario: ["Escritura de propiedad", "Plano catastral", "Certificado de dominio", "Documentación de reclamos previos"],
  otro: ["Documentación relevante al caso", "Comunicaciones previas", "Pruebas de reclamo", "Cualquier antecedente útil"],
};

export default function Requisitos() {
  const [selectedTipo, setSelectedTipo] = useState("civil");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRequisito, setNewRequisito] = useState("");
  const queryClient = useQueryClient();

  const { data: requisitos = [] } = useQuery({
    queryKey: ["requisitos"],
    queryFn: () => base44.entities.Requisito.list("orden"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Requisito.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requisitos"] });
      setNewRequisito("");
      setDialogOpen(false);
    },
  });

  const loadInitialMutation = useMutation({
    mutationFn: async () => {
      const allRequisitos = [];
      let orden = 0;
      for (const [tipo, items] of Object.entries(requisitosIniciales)) {
        for (const descripcion of items) {
          allRequisitos.push({ tipo_asunto: tipo, descripcion, orden: orden++ });
        }
      }
      await base44.entities.Requisito.bulkCreate(allRequisitos);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["requisitos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Requisito.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["requisitos"] }),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, orden }) => base44.entities.Requisito.update(id, { orden }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["requisitos"] }),
  });

  const filtrados = requisitos.filter(r => r.tipo_asunto === selectedTipo).sort((a, b) => (a.orden || 0) - (b.orden || 0));

  const handleAddRequisito = () => {
    if (!newRequisito.trim()) return;
    const nextOrder = Math.max(...filtrados.map(r => r.orden || 0), -1) + 1;
    createMutation.mutate({
      tipo_asunto: selectedTipo,
      descripcion: newRequisito,
      orden: nextOrder,
    });
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const atual = filtrados[idx];
    const anterior = filtrados[idx - 1];
    updateOrderMutation.mutate({ id: atual.id, orden: anterior.orden });
    setTimeout(() => {
      updateOrderMutation.mutate({ id: anterior.id, orden: atual.orden });
    }, 100);
  };

  const moveDown = (idx) => {
    if (idx === filtrados.length - 1) return;
    const atual = filtrados[idx];
    const siguiente = filtrados[idx + 1];
    updateOrderMutation.mutate({ id: atual.id, orden: siguiente.orden });
    setTimeout(() => {
      updateOrderMutation.mutate({ id: siguiente.id, orden: atual.orden });
    }, 100);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Requisitos por Trámite</h1>
          <p className="text-muted-foreground mt-1">Gestiona la documentación requerida para cada tipo de asunto</p>
        </div>
        <div className="flex gap-2">
          {requisitos.length === 0 && (
            <Button onClick={() => loadInitialMutation.mutate()} variant="outline" disabled={loadInitialMutation.isPending}>
              Cargar datos iniciales
            </Button>
          )}
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Agregar Requisito
          </Button>
        </div>
      </div>

      {/* Selector de Tipo */}
      <div className="max-w-sm">
        <Label className="text-sm">Tipo de Asunto</Label>
        <Select value={selectedTipo} onValueChange={setSelectedTipo}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(tipoLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Requisitos */}
      {filtrados.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay requisitos para {tipoLabels[selectedTipo]}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtrados.map((r, idx) => (
            <Card key={r.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" disabled={idx === 0} onClick={() => moveUp(idx)} className="text-xs">
                    ↑
                  </Button>
                  <Button size="sm" variant="ghost" disabled={idx === filtrados.length - 1} onClick={() => moveDown(idx)} className="text-xs">
                    ↓
                  </Button>
                </div>
                <span className="flex-1">{r.descripcion}</span>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(r.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Nuevo Requisito */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Requisito</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Tipo de Asunto</Label>
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Descripción del Requisito *</Label>
              <Input
                placeholder="Ej: Escritura original o copia legalizada"
                value={newRequisito}
                onChange={e => setNewRequisito(e.target.value)}
                onKeyPress={e => e.key === "Enter" && handleAddRequisito()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddRequisito} disabled={!newRequisito.trim()}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}