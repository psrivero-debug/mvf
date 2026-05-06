import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Briefcase, CreditCard,
  Building2, AlertCircle, FileText, Pencil, Check, X,
  Scale, Receipt, FilePlus, FolderOpen, Users, BookMarked, Printer, Calendar
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const estadoCivilLabels = {
  soltero: "Soltero/a", casado: "Casado/a", divorciado: "Divorciado/a",
  viudo: "Viudo/a", union_convivencial: "Unión Convivencial", separado: "Separado/a",
};
const condicionIvaLabels = {
  responsable_inscripto: "Responsable Inscripto", monotributista: "Monotributista",
  exento: "Exento", consumidor_final: "Consumidor Final", no_responsable: "No Responsable",
};
const tipoCasoLabels = {
  civil: "Civil", penal: "Penal", laboral: "Laboral", familia: "Familia",
  comercial: "Comercial", administrativo: "Administrativo", inmobiliario: "Inmobiliario", otro: "Otro",
};
const estadoCasoColors = {
  activo: "bg-green-100 text-green-700",
  en_analisis: "bg-yellow-100 text-yellow-700",
  archivado: "bg-gray-100 text-gray-500",
};
const formaPagoLabels = { efectivo: "Efectivo", transferencia: "Transferencia", cheque: "Cheque", otro: "Otro" };
const formatPesos = (n) => (n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

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
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

const TABS = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "casos", label: "Estudio de Caso", icon: BookMarked },
  { id: "presupuestos", label: "Presupuestos", icon: FilePlus },
  { id: "recibos", label: "Recibos", icon: Receipt },
  { id: "legajo", label: "Legajo", icon: FolderOpen },
  { id: "contrapartes", label: "Contrapartes", icon: Users },
];

export default function ClientePerfil({ clientId, onClose }) {
  const [activeTab, setActiveTab] = useState("perfil");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const queryClient = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const list = await base44.entities.Client.list();
      return list.find(c => c.id === clientId) || null;
    },
    enabled: !!clientId,
  });

  const { data: casos = [] } = useQuery({
    queryKey: ["estudio-casos", clientId],
    queryFn: () => base44.entities.EstudioCaso.filter({ client_id: clientId }, "-created_date"),
    enabled: !!clientId,
  });

  const { data: presupuestos = [] } = useQuery({
    queryKey: ["presupuestos", clientId],
    queryFn: () => base44.entities.Presupuesto.filter({ client_id: clientId }, "-created_date"),
    enabled: !!clientId,
  });

  const { data: recibos = [] } = useQuery({
    queryKey: ["recibos", clientId],
    queryFn: () => base44.entities.Recibo.filter({ client_id: clientId }, "-created_date"),
    enabled: !!clientId,
  });

  const { data: legajos = [] } = useQuery({
    queryKey: ["legajos", clientId],
    queryFn: () => base44.entities.Legajo.filter({ client_id: clientId }, "-created_date"),
    enabled: !!clientId,
  });

  const { data: contrapartes = [] } = useQuery({
    queryKey: ["contrapartes", clientId],
    queryFn: () => base44.entities.Contraparte.filter({ client_id: clientId }),
    enabled: !!clientId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setEditing(false);
    },
  });

  const startEdit = () => setForm({ ...emptyClient, ...client });

  const handleSave = () => {
    const data = {
      ...form,
      full_name: form.client_type === "persona_juridica"
        ? form.razon_social
        : `${form.nombre} ${form.apellido}`.trim(),
    };
    updateMutation.mutate({ id: client.id, data });
  };

  if (isLoading || !client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isJuridica = (editing ? form.client_type : client.client_type) === "persona_juridica";
  const nombreDisplay = client.client_type === "persona_juridica"
    ? client.razon_social || client.full_name
    : client.apellido ? `${client.apellido}, ${client.nombre}` : client.full_name;
  const totalRecibos = recibos.reduce((s, r) => s + (r.monto || 0), 0);

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {(client.full_name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-serif font-bold truncate">{nombreDisplay}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                {client.numero_legajo && (
                  <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
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
            {/* Stats rápidos */}
            <div className="hidden lg:flex items-center gap-6 text-center">
              <div>
                <p className="text-lg font-bold text-primary">{casos.length}</p>
                <p className="text-xs text-muted-foreground">Casos</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{presupuestos.length}</p>
                <p className="text-xs text-muted-foreground">Presupuestos</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">{formatPesos(totalRecibos)}</p>
                <p className="text-xs text-muted-foreground">Total Cobrado</p>
              </div>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="px-6 lg:px-8 flex gap-1 overflow-x-auto pb-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 lg:px-8 py-6 max-w-5xl mx-auto">

        {/* ===== PERFIL ===== */}
        {activeTab === "perfil" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              {!editing ? (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { startEdit(); setEditing(true); }}>
                  <Pencil className="w-3.5 h-3.5" /> Editar datos
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(false)}>
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </Button>
                  <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={updateMutation.isPending}>
                    <Check className="w-3.5 h-3.5" />
                    {updateMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>

            {!editing ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">
                      {isJuridica ? "Datos de la Empresa" : "Datos Personales"}
                    </p>
                    {isJuridica ? (
                      <>
                        <InfoRow icon={Building2} label="Razón Social" value={client.razon_social} />
                        <InfoRow icon={CreditCard} label="CUIT" value={client.dni_cuit} />
                        <InfoRow icon={FileText} label="Condición IVA" value={condicionIvaLabels[client.condicion_iva]} />
                      </>
                    ) : (
                      <>
                        <InfoRow icon={User} label="Nombre completo" value={`${client.nombre || ""} ${client.apellido || ""}`.trim()} />
                        <InfoRow icon={CreditCard} label={client.tipo_dni || "DNI"} value={client.dni_cuit} />
                        <InfoRow icon={User} label="Estado Civil" value={estadoCivilLabels[client.estado_civil]} />
                        <InfoRow icon={Briefcase} label="Ocupación" value={client.ocupacion} />
                      </>
                    )}
                  </CardContent>
                </Card>

                {isJuridica && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-5 space-y-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">Representante Legal</p>
                      <InfoRow icon={User} label="Nombre y Apellido" value={client.representante_legal} />
                      <InfoRow icon={CreditCard} label="DNI" value={client.dni_representante} />
                    </CardContent>
                  </Card>
                )}

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">Contacto y Domicilio</p>
                    <InfoRow icon={Phone} label="Teléfono" value={client.phone} />
                    <InfoRow icon={Mail} label="Email" value={client.email} />
                    <InfoRow icon={MapPin} label="Domicilio" value={client.address} />
                    <InfoRow icon={MapPin} label="Localidad" value={client.localidad} />
                  </CardContent>
                </Card>

                {(client.datos_a_tener_en_cuenta || client.notes) && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-5 space-y-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">Notas</p>
                      {client.datos_a_tener_en_cuenta && (
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Datos a tener en cuenta</p>
                            <p className="text-sm whitespace-pre-wrap">{client.datos_a_tener_en_cuenta}</p>
                          </div>
                        </div>
                      )}
                      {client.notes && (
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Notas internas</p>
                            <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* Formulario edición */
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Nº de Legajo</Label>
                        <Input value={form.numero_legajo} onChange={e => setForm({ ...form, numero_legajo: e.target.value })} />
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

                    {isJuridica ? (
                      <>
                        <div className="grid gap-2">
                          <Label>Razón Social</Label>
                          <Input value={form.razon_social} onChange={e => setForm({ ...form, razon_social: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2"><Label>CUIT</Label><Input value={form.dni_cuit} onChange={e => setForm({ ...form, dni_cuit: e.target.value })} /></div>
                          <div className="grid gap-2">
                            <Label>Condición IVA</Label>
                            <Select value={form.condicion_iva} onValueChange={v => setForm({ ...form, condicion_iva: v })}>
                              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                              <SelectContent>{Object.entries(condicionIvaLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2"><Label>Representante Legal</Label><Input value={form.representante_legal} onChange={e => setForm({ ...form, representante_legal: e.target.value })} /></div>
                          <div className="grid gap-2"><Label>DNI Representante</Label><Input value={form.dni_representante} onChange={e => setForm({ ...form, dni_representante: e.target.value })} /></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2"><Label>Nombre/s</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
                          <div className="grid gap-2"><Label>Apellido/s</Label><Input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="grid gap-2">
                            <Label>Tipo doc.</Label>
                            <Select value={form.tipo_dni} onValueChange={v => setForm({ ...form, tipo_dni: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{["DNI","CUIT","CUIL","Pasaporte","Otro"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2 col-span-2"><Label>Nº {form.tipo_dni || "DNI"}</Label><Input value={form.dni_cuit} onChange={e => setForm({ ...form, dni_cuit: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Estado Civil</Label>
                            <Select value={form.estado_civil} onValueChange={v => setForm({ ...form, estado_civil: v })}>
                              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                              <SelectContent>{Object.entries(estadoCivilLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2"><Label>Ocupación</Label><Input value={form.ocupacion} onChange={e => setForm({ ...form, ocupacion: e.target.value })} /></div>
                        </div>
                      </>
                    )}

                    <div className="grid gap-2"><Label>Domicilio</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2"><Label>Localidad</Label><Input value={form.localidad} onChange={e => setForm({ ...form, localidad: e.target.value })} /></div>
                      <div className="grid gap-2"><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                    </div>
                    <div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                    <div className="grid gap-2"><Label>Datos a tener en cuenta</Label><Textarea value={form.datos_a_tener_en_cuenta} onChange={e => setForm({ ...form, datos_a_tener_en_cuenta: e.target.value })} rows={3} /></div>
                    <div className="grid gap-2"><Label>Notas internas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ===== ESTUDIO DE CASOS ===== */}
        {activeTab === "casos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
                <BookMarked className="w-5 h-5" /> Casos de {client.full_name?.split(" ")[0]}
              </h2>
              <Badge variant="outline">{casos.length} caso{casos.length !== 1 ? "s" : ""}</Badge>
            </div>
            {casos.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <BookMarked className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No hay casos registrados para este cliente</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {casos.map(caso => (
                  <Card key={caso.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoCasoColors[caso.estado] || "bg-gray-100 text-gray-600"}`}>
                              {caso.estado === "en_analisis" ? "En análisis" : caso.estado?.charAt(0).toUpperCase() + caso.estado?.slice(1)}
                            </span>
                            {caso.tipo_caso && (
                              <Badge variant="outline" className="text-xs">{tipoCasoLabels[caso.tipo_caso] || caso.tipo_caso}</Badge>
                            )}
                          </div>
                          <h3 className="font-semibold">{caso.titulo}</h3>
                          {caso.numero_expediente && (
                            <p className="text-xs text-muted-foreground mt-1">Expte. {caso.numero_expediente}</p>
                          )}
                          {caso.jurisdiccion && (
                            <p className="text-xs text-muted-foreground">{caso.jurisdiccion}</p>
                          )}
                          {caso.descripcion && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{caso.descripcion}</p>
                          )}
                          {caso.hechos_resumen && (
                            <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">"{caso.hechos_resumen}"</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {caso.created_date ? format(new Date(caso.created_date), "d MMM yyyy", { locale: es }) : ""}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== PRESUPUESTOS ===== */}
        {activeTab === "presupuestos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
                <FilePlus className="w-5 h-5" /> Presupuestos
              </h2>
              <Badge variant="outline">{presupuestos.length} presupuesto{presupuestos.length !== 1 ? "s" : ""}</Badge>
            </div>
            {presupuestos.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <FilePlus className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No hay presupuestos para este cliente</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {presupuestos.map(p => (
                  <Card key={p.id} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {p.numero && <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">#{p.numero}</span>}
                            <Badge variant={p.estado === "aceptado" ? "default" : p.estado === "vencido" ? "destructive" : "secondary"} className="text-xs">
                              {p.estado || "vigente"}
                            </Badge>
                          </div>
                          {p.conceptos_nombres && <p className="text-sm text-muted-foreground">{p.conceptos_nombres}</p>}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                            {p.fecha_emision && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(p.fecha_emision + "T12:00:00"), "d MMM yyyy", { locale: es })}
                              </span>
                            )}
                            {p.fecha_vencimiento && (
                              <span className="text-amber-600">Vence: {format(new Date(p.fecha_vencimiento + "T12:00:00"), "d MMM yyyy", { locale: es })}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">Arancel</p>
                          <p className="text-lg font-bold text-primary">{formatPesos(p.monto_base)}</p>
                          <p className="text-xs text-muted-foreground">+ IVA</p>
                          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            {p.monto_efectivo_desc > 0 && <p>Efectivo: <span className="font-medium text-green-700">{formatPesos(p.monto_efectivo_desc)}</span></p>}
                            {p.cuotas_6 > 0 && <p>6 cuotas: {formatPesos(p.cuotas_6)}/mes</p>}
                            {p.cuotas_12 > 0 && <p>12 cuotas: {formatPesos(p.cuotas_12)}/mes</p>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== RECIBOS ===== */}
        {activeTab === "recibos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
                <Receipt className="w-5 h-5" /> Recibos
              </h2>
              <div className="flex items-center gap-3">
                {recibos.length > 0 && (
                  <span className="text-sm font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg">
                    Total cobrado: {formatPesos(totalRecibos)}
                  </span>
                )}
                <Badge variant="outline">{recibos.length} recibo{recibos.length !== 1 ? "s" : ""}</Badge>
              </div>
            </div>
            {recibos.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Receipt className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No hay recibos para este cliente</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recibos.map(r => (
                  <Card key={r.id} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {r.numero && <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">#{r.numero}</span>}
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                              {formaPagoLabels[r.forma_pago] || r.forma_pago}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{r.concepto}</p>
                          {r.fecha && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(r.fecha + "T12:00:00"), "d 'de' MMMM yyyy", { locale: es })}
                            </p>
                          )}
                        </div>
                        <p className="text-xl font-bold text-green-700 shrink-0">{formatPesos(r.monto)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== LEGAJO ===== */}
        {activeTab === "legajo" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
                <FolderOpen className="w-5 h-5" /> Documentos del Legajo
              </h2>
              <Badge variant="outline">{legajos.length} documento{legajos.length !== 1 ? "s" : ""}</Badge>
            </div>
            {legajos.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No hay documentos en el legajo</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {legajos.map(leg => (
                  <Card key={leg.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      {leg.file_url && (
                        <a href={leg.file_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={leg.file_url}
                            alt={leg.titulo}
                            className="w-full h-40 object-cover rounded-lg mb-3 bg-muted"
                            onError={e => { e.target.style.display = "none"; }}
                          />
                        </a>
                      )}
                      <p className="font-medium text-sm">{leg.titulo}</p>
                      {leg.tipo_documento && (
                        <Badge variant="outline" className="text-xs mt-1">{leg.tipo_documento}</Badge>
                      )}
                      {leg.fecha_documento && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(leg.fecha_documento + "T12:00:00"), "d MMM yyyy", { locale: es })}
                        </p>
                      )}
                      {leg.notas && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{leg.notas}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== CONTRAPARTES ===== */}
        {activeTab === "contrapartes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" /> Contrapartes
              </h2>
              <Badge variant="outline">{contrapartes.length} contraparte{contrapartes.length !== 1 ? "s" : ""}</Badge>
            </div>
            {contrapartes.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No hay contrapartes registradas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {contrapartes.map(cp => (
                  <Card key={cp.id} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                          {cp.apellido?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                          <div>
                            <p className="font-semibold">{cp.apellido}, {cp.nombre}</p>
                            <p className="text-xs text-muted-foreground">{cp.tipo_doc}: {cp.dni_cuit}</p>
                            {cp.parentesco && <p className="text-xs text-muted-foreground">Vínculo: {cp.parentesco}</p>}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            {cp.domicilio && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{cp.domicilio}{cp.localidad ? `, ${cp.localidad}` : ""}</p>}
                            {cp.telefono && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{cp.telefono}</p>}
                            {cp.donde_trabaja && <p className="flex items-center gap-1.5"><Briefcase className="w-3 h-3" />{cp.donde_trabaja}</p>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}