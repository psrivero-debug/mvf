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
import { Plus, Search, User, Phone, Mail, MapPin, Pencil, Trash2, Users } from "lucide-react";
import ContraparteModal from "@/components/clients/ContraparteModal";

const emptyClient = {
  client_type: "persona_fisica",
  // Persona física
  nombre: "", apellido: "", dni_cuit: "", tipo_dni: "DNI", estado_civil: "",
  // Persona jurídica
  razon_social: "", condicion_iva: "", representante_legal: "", dni_representante: "",
  // Comunes
  full_name: "", email: "", phone: "", address: "", localidad: "",
  ocupacion: "", datos_a_tener_en_cuenta: "", notes: "", status: "activo"
};

const estadoCivilLabels = {
  soltero: "Soltero/a",
  casado: "Casado/a",
  divorciado: "Divorciado/a",
  viudo: "Viudo/a",
  union_convivencial: "Unión Convivencial",
  separado: "Separado/a",
};

const condicionIvaLabels = {
  responsable_inscripto: "Responsable Inscripto",
  monotributista: "Monotributista",
  exento: "Exento",
  consumidor_final: "Consumidor Final",
  no_responsable: "No Responsable",
};

export default function Clients() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyClient);
  const [contraparteClient, setContraparteClient] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clients"] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clients"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyClient); };

  const openEdit = (client) => {
    setEditing(client);
    setForm({ ...emptyClient, ...client });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...form,
      full_name: form.client_type === "persona_juridica"
        ? form.razon_social
        : `${form.nombre} ${form.apellido}`.trim(),
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isJuridica = form.client_type === "persona_juridica";
  const isFormValid = isJuridica
    ? form.razon_social && form.dni_cuit && form.address && form.localidad && form.phone && form.condicion_iva && form.representante_legal && form.dni_representante
    : form.nombre && form.apellido && form.dni_cuit && form.address && form.estado_civil;

  const filtered = clients.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.dni_cuit?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gestión de clientes del estudio</p>
        </div>
        <Button onClick={() => { setForm(emptyClient); setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, DNI o email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground mt-4">No se encontraron clientes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => (
            <Card key={client.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {client.full_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {client.client_type === "persona_juridica"
                          ? client.razon_social || client.full_name
                          : client.apellido ? `${client.apellido}, ${client.nombre}` : client.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {client.client_type === "persona_juridica"
                          ? `Persona Jurídica${client.condicion_iva ? " · " + condicionIvaLabels[client.condicion_iva] : ""}`
                          : `Persona Física${client.estado_civil ? " · " + (estadoCivilLabels[client.estado_civil] || client.estado_civil) : ""}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={client.status === "activo" ? "default" : "secondary"} className="text-xs">
                    {client.status === "activo" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {client.dni_cuit && <p className="flex items-center gap-2"><User className="w-3.5 h-3.5" />{client.client_type === "persona_juridica" ? "CUIT" : (client.tipo_dni || "DNI")}: {client.dni_cuit}</p>}
                  {client.client_type === "persona_juridica" && client.representante_legal && <p className="flex items-center gap-2"><User className="w-3.5 h-3.5" />Rep.: {client.representante_legal}</p>}
                  {client.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{client.phone}</p>}
                  {client.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{client.email}</p>}
                  {client.address && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{client.address}</p>}
                </div>
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => openEdit(client)} className="gap-1 text-xs">
                    <Pencil className="w-3 h-3" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setContraparteClient(client)} className="gap-1 text-xs text-blue-700 border-blue-300 hover:bg-blue-50">
                    <Users className="w-3 h-3" /> Contraparte
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive text-xs" onClick={() => deleteMutation.mutate(client.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ContraparteModal
        client={contraparteClient}
        open={!!contraparteClient}
        onClose={() => setContraparteClient(null)}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Tipo de cliente - siempre primero */}
            <div className="grid gap-2">
              <Label>Tipo de cliente <span className="text-destructive">*</span></Label>
              <Select value={form.client_type} onValueChange={v => setForm({ ...form, client_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="persona_fisica">Persona Física</SelectItem>
                  <SelectItem value="persona_juridica">Persona Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isJuridica ? (
              <>
                {/* PERSONA JURÍDICA */}
                <div className="grid gap-2">
                  <Label>Razón Social <span className="text-destructive">*</span></Label>
                  <Input placeholder="Ej: Comercial XYZ S.A." value={form.razon_social} onChange={e => setForm({ ...form, razon_social: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>CUIT <span className="text-destructive">*</span></Label>
                    <Input placeholder="Ej: 30-12345678-9" value={form.dni_cuit} onChange={e => setForm({ ...form, dni_cuit: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Condición frente al IVA <span className="text-destructive">*</span></Label>
                    <Select value={form.condicion_iva} onValueChange={v => setForm({ ...form, condicion_iva: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(condicionIvaLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Domicilio <span className="text-destructive">*</span></Label>
                  <Input placeholder="Calle, número, piso" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Localidad <span className="text-destructive">*</span></Label>
                    <Input placeholder="Ej: San Luis" value={form.localidad} onChange={e => setForm({ ...form, localidad: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Teléfono <span className="text-destructive">*</span></Label>
                    <Input placeholder="Ej: 2664 123456" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Representante Legal</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Nombre y Apellido <span className="text-destructive">*</span></Label>
                    <Input placeholder="Ej: Juan García" value={form.representante_legal} onChange={e => setForm({ ...form, representante_legal: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>DNI Representante <span className="text-destructive">*</span></Label>
                    <Input placeholder="Ej: 30.123.456" value={form.dni_representante} onChange={e => setForm({ ...form, dni_representante: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="ejemplo@empresa.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </>
            ) : (
              <>
                {/* PERSONA FÍSICA */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Nombre/s <span className="text-destructive">*</span></Label>
                    <Input placeholder="Ej: Juan Carlos" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Apellido/s <span className="text-destructive">*</span></Label>
                    <Input placeholder="Ej: García López" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo doc. <span className="text-destructive">*</span></Label>
                    <Select value={form.tipo_dni} onValueChange={v => setForm({ ...form, tipo_dni: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["DNI","CUIT","CUIL","Pasaporte","Otro"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 col-span-2">
                    <Label>Nº {form.tipo_dni || "DNI"} <span className="text-destructive">*</span></Label>
                    <Input placeholder="Ej: 30.123.456" value={form.dni_cuit} onChange={e => setForm({ ...form, dni_cuit: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Estado Civil <span className="text-destructive">*</span></Label>
                    <Select value={form.estado_civil} onValueChange={v => setForm({ ...form, estado_civil: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(estadoCivilLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Ocupación / Profesión</Label>
                    <Input placeholder="Ej: Comerciante, Empleado..." value={form.ocupacion} onChange={e => setForm({ ...form, ocupacion: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Domicilio <span className="text-destructive">*</span></Label>
                  <Input placeholder="Calle, número, piso" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Localidad</Label>
                    <Input placeholder="Ej: San Luis" value={form.localidad} onChange={e => setForm({ ...form, localidad: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Teléfono</Label>
                    <Input placeholder="Ej: 2664 123456" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="ejemplo@mail.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label>Datos a tener en cuenta</Label>
              <Textarea placeholder="Información relevante: antecedentes, situación particular, etc." value={form.datos_a_tener_en_cuenta} onChange={e => setForm({ ...form, datos_a_tener_en_cuenta: e.target.value })} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Notas internas</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!isFormValid}>
              {editing ? "Guardar Cambios" : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}