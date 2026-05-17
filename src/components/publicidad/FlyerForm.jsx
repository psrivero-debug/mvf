import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, Sparkles } from "lucide-react";

const SERVICIOS = [
  "Consultas Legales",
  "Defensa de Derechos",
  "Derecho Civil",
  "Derecho Laboral",
  "Negocios Inmobiliarios",
  "Derecho de Familia",
  "Derecho Comercial",
  "Derecho Administrativo",
];

const ESTILOS = [
  { label: "Profesional y elegante", value: "professional" },
  { label: "Moderno y dinámico", value: "modern" },
  { label: "Minimalista", value: "minimal" },
  { label: "Impactante y llamativo", value: "bold" },
];

export default function FlyerForm({ generating, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    titulo: "",
    servicio: "",
    descripcion: "",
    estilo: "professional",
    telefono: "2664 169108",
    domicilio: "25 de Mayo N° 477",
  });

  const handleSubmit = () => {
    if (!form.titulo || !form.servicio) return;
    onSubmit(form);
  };

  return (
    <>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label>Título del flyer *</Label>
          <Input
            placeholder="Ej: Consultá tu caso hoy"
            value={form.titulo}
            onChange={e => setForm({ ...form, titulo: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Servicio a promocionar *</Label>
          <Select value={form.servicio} onValueChange={v => setForm({ ...form, servicio: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná un servicio" />
            </SelectTrigger>
            <SelectContent>
              {SERVICIOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Mensaje clave (opcional)</Label>
          <Textarea
            placeholder="Ej: Primera consulta sin cargo, asesoramiento personalizado..."
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Estilo del diseño</Label>
          <Select value={form.estilo} onValueChange={v => setForm({ ...form, estilo: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ESTILOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input
              placeholder="2664 169108"
              value={form.telefono}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Domicilio</Label>
            <Input
              placeholder="25 de Mayo N° 477"
              value={form.domicilio}
              onChange={e => setForm({ ...form, domicilio: e.target.value })}
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={generating}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          disabled={!form.titulo || !form.servicio || generating}
          className="gap-2"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generar con IA</>
          )}
        </Button>
      </DialogFooter>
    </>
  );
}