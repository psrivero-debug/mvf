import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AsignarTurnoModal({ open, onClose, evento, onAsignar }) {
  const [clientSearch, setClientSearch] = useState(evento?.client_name || "");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDrop, setShowDrop] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [titulo, setTitulo] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("full_name"),
  });

  const filtered = clients.filter(c =>
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleAsignar = () => {
    onAsignar(evento, {
      client_id: selectedClient?.id || "",
      client_name: clientSearch,
      titulo: titulo || `Turno — ${clientSearch}`,
      descripcion,
      estado: "ocupado",
      tipo: "turno",
    });
  };

  if (!evento) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">Asignar Turno</DialogTitle>
        </DialogHeader>

        <div className="bg-muted/40 rounded-xl p-4 space-y-1.5 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bloque disponible</p>
          <p className="font-medium">{evento.abogada_nombre}</p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />
              {evento.fecha ? format(new Date(evento.fecha + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es }) : ""}
            </span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{evento.hora_inicio} – {evento.hora_fin}</span>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Cliente *</Label>
            <div className="relative">
              <Input
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); setSelectedClient(null); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              />
              {showDrop && filtered.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filtered.map(c => (
                    <button key={c.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                      onMouseDown={() => { setClientSearch(c.full_name); setSelectedClient(c); setShowDrop(false); }}>
                      {c.full_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Motivo / Título</Label>
            <Input placeholder="Ej: Consulta inicial, Alimentos..." value={titulo} onChange={e => setTitulo(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Notas</Label>
            <Textarea placeholder="Observaciones..." value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAsignar} disabled={!clientSearch}>
            Confirmar Turno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}