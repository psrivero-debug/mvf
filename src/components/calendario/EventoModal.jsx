import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const tipoLabels = {
  turno: "Turno",
  audiencia: "Audiencia",
  cita: "Cita",
  disponibilidad: "Bloque disponible",
};

const emptyForm = {
  tipo: "turno",
  titulo: "",
  fecha: "",
  hora_inicio: "09:00",
  hora_fin: "10:00",
  client_id: "",
  client_name: "",
  descripcion: "",
  estado: "ocupado",
  numero_expediente: "",
  juzgado: "",
};

export default function EventoModal({ open, onClose, onSave, evento, fechaInicial, abogadaEmail, abogadaNombre, isSecretaria, abogadas }) {
  const [form, setForm] = useState(emptyForm);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDrop, setShowClientDrop] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("full_name"),
  });

  useEffect(() => {
    if (evento) {
      setForm({ ...emptyForm, ...evento });
      setClientSearch(evento.client_name || "");
    } else {
      setForm({ ...emptyForm, fecha: fechaInicial || new Date().toISOString().split("T")[0] });
      setClientSearch("");
    }
  }, [evento, fechaInicial, open]);

  const filteredClients = clients.filter(c =>
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSave = () => {
    const data = {
      ...form,
      abogada_email: isSecretaria ? (form.abogada_email || abogadaEmail) : abogadaEmail,
      abogada_nombre: isSecretaria ? (form.abogada_nombre || abogadaNombre) : abogadaNombre,
    };
    onSave(data);
  };

  const isDisponibilidad = form.tipo === "disponibilidad";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {evento ? "Editar Evento" : "Nuevo Evento"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
          {/* Si es secretaria, puede elegir abogada */}
          {isSecretaria && abogadas && (
            <div className="grid gap-2">
              <Label>Abogada *</Label>
              <Select
                value={form.abogada_email}
                onValueChange={v => {
                  const ab = abogadas.find(a => a.email === v);
                  setForm({ ...form, abogada_email: v, abogada_nombre: ab?.full_name || v });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar abogada..." /></SelectTrigger>
                <SelectContent>
                  {abogadas.map(a => (
                    <SelectItem key={a.id} value={a.email}>{a.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Tipo *</Label>
            <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v, estado: v === "disponibilidad" ? "disponible" : "ocupado" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(tipoLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isDisponibilidad && (
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input
                placeholder="Ej: Audiencia inicial, Consulta García..."
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2 col-span-1">
              <Label>Fecha *</Label>
              <Input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Desde</Label>
              <Input type="time" value={form.hora_inicio} onChange={e => setForm({ ...form, hora_inicio: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Hasta</Label>
              <Input type="time" value={form.hora_fin} onChange={e => setForm({ ...form, hora_fin: e.target.value })} />
            </div>
          </div>

          {!isDisponibilidad && (
            <>
              <div className="grid gap-2">
                <Label>Cliente</Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChange={e => { setClientSearch(e.target.value); setForm({ ...form, client_name: e.target.value, client_id: "" }); setShowClientDrop(true); }}
                    onFocus={() => setShowClientDrop(true)}
                    onBlur={() => setTimeout(() => setShowClientDrop(false), 150)}
                  />
                  {showClientDrop && filteredClients.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredClients.map(c => (
                        <button key={c.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                          onMouseDown={() => { setClientSearch(c.full_name); setForm({ ...form, client_id: c.id, client_name: c.full_name }); setShowClientDrop(false); }}>
                          {c.full_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {form.tipo === "audiencia" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Expediente</Label>
                    <Input placeholder="Nº expediente" value={form.numero_expediente} onChange={e => setForm({ ...form, numero_expediente: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Juzgado</Label>
                    <Input placeholder="Juzgado..." value={form.juzgado} onChange={e => setForm({ ...form, juzgado: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Descripción / Notas</Label>
                <Textarea
                  placeholder="Observaciones..."
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.fecha || !form.hora_inicio || (isSecretaria && !form.abogada_email)}>
            {evento ? "Guardar Cambios" : "Crear Evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}