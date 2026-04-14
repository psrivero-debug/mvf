import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StickyNote, Plus, Trash2, Star, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const etiquetas = {
  nota: { label: "Nota", color: "bg-gray-100 text-gray-600", icon: StickyNote },
  importante: { label: "Importante", color: "bg-yellow-100 text-yellow-700", icon: Star },
  pendiente: { label: "Pendiente", color: "bg-red-100 text-red-700", icon: AlertCircle },
  recordatorio: { label: "Recordatorio", color: "bg-blue-100 text-blue-700", icon: Clock },
};

export default function Anotaciones({ caso }) {
  const [texto, setTexto] = useState("");
  const [etiqueta, setEtiqueta] = useState("nota");
  const queryClient = useQueryClient();

  const { data: anotaciones = [] } = useQuery({
    queryKey: ["caso_anotaciones", caso.id],
    queryFn: () => base44.entities.CasoAnotacion.filter({ caso_id: caso.id }, "-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CasoAnotacion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caso_anotaciones", caso.id] });
      setTexto("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CasoAnotacion.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["caso_anotaciones", caso.id] }),
  });

  const handleAgregar = () => {
    if (!texto.trim()) return;
    createMutation.mutate({ caso_id: caso.id, texto: texto.trim(), etiqueta });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <StickyNote className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Anotaciones</h3>
        {anotaciones.length > 0 && (
          <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{anotaciones.length}</span>
        )}
      </div>

      {/* Formulario de nueva anotación */}
      <div className="space-y-2 mb-4">
        <Textarea
          placeholder="Escribí una anotación, idea o recordatorio..."
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={3}
          className="resize-none text-sm"
          onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleAgregar(); }}
        />
        <div className="flex gap-2">
          <Select value={etiqueta} onValueChange={setEtiqueta}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(etiquetas).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAgregar}
            disabled={!texto.trim() || createMutation.isPending}
            className="gap-1 h-8 text-xs"
          >
            <Plus className="w-3 h-3" /> Guardar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Ctrl+Enter para guardar rápido</p>
      </div>

      {/* Lista de anotaciones */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {anotaciones.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-xl">
            <StickyNote className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Aún no hay anotaciones</p>
          </div>
        ) : (
          anotaciones.map(a => {
            const config = etiquetas[a.etiqueta] || etiquetas.nota;
            const Icon = config.icon;
            return (
              <div key={a.id} className="p-3 rounded-lg border bg-card group relative hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <Badge className={`${config.color} text-xs gap-1 py-0`} variant="secondary">
                    <Icon className="w-2.5 h-2.5" /> {config.label}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                    onClick={() => deleteMutation.mutate(a.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-snug">{a.texto}</p>
                <p className="text-xs text-muted-foreground/60 mt-1.5">
                  {a.created_date ? format(new Date(a.created_date), "d MMM yyyy, HH:mm", { locale: es }) : ""}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}