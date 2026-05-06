import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Phone, Mail, MapPin, User, Briefcase, FileText,
  Pencil, X, Check, Building2, CreditCard, AlertCircle
} from "lucide-react";

const estadoCivilLabels = {
  soltero: "Soltero/a", casado: "Casado/a", divorciado: "Divorciado/a",
  viudo: "Viudo/a", union_convivencial: "Unión Convivencial", separado: "Separado/a",
};
const condicionIvaLabels = {
  responsable_inscripto: "Responsable Inscripto", monotributista: "Monotributista",
  exento: "Exento", consumidor_final: "Consumidor Final", no_responsable: "No Responsable",
};

const emptyClient = {
  client_type: "persona_fisica", numero_legajo: "",
  nombre: "", apellido: "", dni_cuit: "", tipo_dni: "DNI", estado_civil: "",
  razon_social: "", condicion_iva: "", representante_legal: "", dni_representante: "",
  full_name: "", email: "", phone: "", address: "", localidad: "",
  ocupacion: "", datos_a_tener_en_cuenta: "", notes: "", status: "activo"
};

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 border-b pb-1">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function ClientDetailModal({ client, open, onClose }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setEditing(false);
    },
  });

  const startEdit = () => {
    setForm({ ...emptyClient, ...client });
    setEditing(true);
  };

  const handleSave = () => {
    const data = {
      ...form,
      full_name: form.client_type === "persona_juridica"
        ? form.razon_social
        : `${form.nombre} ${form.apellido}`.trim(),
    };
    updateMutation.mutate({ id: client.id, data });
  };

  const handleClose = () => {
    setEditing(false);
    onClose();
  };

  if (!client) return null;

  const isJuridica = (editing ? form.client_type : client.client_type) === "persona_juridica";
  const nombreDisplay = client.client_type === "persona_juridica"
    ? client.razon_social || client.full_name
    : client.apellido ? `${client.apellido}, ${client.nombre}` : client.full_name;

  const isFormValid = isJuridica
    ? form.razon_social && form.dni_cuit
    : form.nombre && form.apellido && form.dni_cuit;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0">
              {(client.full_name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate">{nombreDisplay}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {client.numero_legajo && (
                  <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Legajo Nº {client.numero_legajo}
                  </span>
                )}
                <Badge variant={client.status === "activo" ? "default" : "secondary"} className="text-xs">
                  {client.status === "activo" ? "Activo" : "Inactivo"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {client.client_type === "persona_juridica" ? "Persona Jurídica" : "Persona Física"}
                </Badge>
              </div>
            </div>
            {!editing && (
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={startEdit}>
                <Pencil className="w-3.5 h-3.5" /> Editar
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {!editing ? (
          /* ---- VISTA ---- */
          <div className="space-y-6 pt-2">
            {client.client_type === "persona_juridica" ? (
              <>
                <Section title="Datos de la Empresa">
                  <InfoRow icon={Building2} label="Razón Social" value={client.razon_social} />
                  <InfoRow icon={CreditCard} label="CUIT" value={client.dni_cuit} />
                  <InfoRow icon={FileText} label="Condición IVA" value={condicionIvaLabels[client.condicion_iva] || client.condicion_iva} />
                </Section>
                <Section title="Representante Legal">
                  <InfoRow icon={User} label="Nombre" value={client.representante_legal} />
                  <InfoRow icon={CreditCard} label="DNI" value={client.dni_representante} />
                </Section>
              </>
            ) : (
              <>
                <Section title="Datos Personales">
                  <InfoRow icon={User} label="Nombre completo" value={`${client.nombre || ""} ${client.apellido || ""}`.trim()} />
                  <InfoRow icon={CreditCard} label={client.tipo_dni || "DNI"} value={client.dni_cuit} />
                  <InfoRow icon={User} label="Estado Civil" value={estadoCivilLabels[client.estado_civil] || client.estado_civil} />
                  <InfoRow icon={Briefcase} label="Ocupación" value={client.ocupacion} />
                </Section>
              </>
            )}

            <Section title="Contacto y Domicilio">
              <InfoRow icon={Phone} label="Teléfono" value={client.phone} />
              <InfoRow icon={Mail} label="Email" value={client.email} />
              <InfoRow icon={MapPin} label="Domicilio" value={[client.address, client.localidad].filter(Boolean).join(", ")} />
            </Section>

            {(client.datos_a_tener_en_cuenta || client.notes) && (
              <Section title="Notas e Información Relevante">
                {client.datos_a_tener_en_cuenta && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Datos a tener en cuenta</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{client.datos_a_tener_en_cuenta}</p>
                    </div>
                  </div>
                )}
                {client.notes && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Notas internas</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  </div>
                )}
              </Section>
            )}
          </div>
        ) : (
          /* ---- EDICIÓN ---- */
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nº de Legajo</Label>
              <Input placeholder="Ej: 2026-001" value={form.numero_legajo} onChange={e => setForm({ ...form, numero_legajo: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Tipo de cliente</Label>
              <Select value={form.client_type} onValueChange={v => setForm({ ...form, client_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="persona_fisica">Persona Física</SelectItem>
                  <SelectItem value="persona_juridica">Persona Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isJuridica ? (
              <>
                <div className="grid gap-2">
                  <Label>Razón Social <span className="text-destructive">*</span></Label>
                  <Input value={form.razon_social} onChange={e => setForm({ ...form, razon_social: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>CUIT <span className="text-destructive">*</span></Label>
                    <Input value={form.dni_cuit} onChange={e => setForm({ ...form, dni_cuit: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Condición IVA</Label>
                    <Select value={form.condicion_iva} onValueChange={v => setForm({ ...form, condicion_iva: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(condicionIvaLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Representante Legal</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Nombre y Apellido</Label>
                    <Input value={form.representante_legal} onChange={e => setForm({ ...form, representante_legal: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>DNI</Label>
                    <Input value={form.dni_representante} onChange={e => setForm({ ...form, dni_representante: e.target.value })} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Nombre/s <span className="text-destructive">*</span></Label>
                    <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Apellido/s <span className="text-destructive">*</span></Label>
                    <Input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo doc.</Label>
                    <Select value={form.tipo_dni} onValueChange={v => setForm({ ...form, tipo_dni: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["DNI","CUIT","CUIL","Pasaporte","Otro"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 col-span-2">
                    <Label>Nº {form.tipo_dni || "DNI"} <span className="text-destructive">*</span></Label>
                    <Input value={form.dni_cuit} onChange={e => setForm({ ...form, dni_cuit: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Estado Civil</Label>
                    <Select value={form.estado_civil} onValueChange={v => setForm({ ...form, estado_civil: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(estadoCivilLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Ocupación</Label>
                    <Input value={form.ocupacion} onChange={e => setForm({ ...form, ocupacion: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label>Domicilio</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Localidad</Label>
                <Input value={form.localidad} onChange={e => setForm({ ...form, localidad: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Datos a tener en cuenta</Label>
              <Textarea value={form.datos_a_tener_en_cuenta} onChange={e => setForm({ ...form, datos_a_tener_en_cuenta: e.target.value })} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Notas internas</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setEditing(false)} className="gap-1.5">
                <X className="w-4 h-4" /> Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!isFormValid || updateMutation.isPending} className="gap-1.5">
                <Check className="w-4 h-4" />
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}