import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, ClipboardList, User, Calendar, Pencil, Trash2, Calculator, UserPlus, Printer } from "lucide-react";
import AudioTranscriber from "../components/AudioTranscriber";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const estadoLabels = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  presupuestada: "Presupuestada",
  aceptada: "Aceptada",
  cerrada: "Cerrada",
};

const estadoColors = {
  pendiente: "bg-yellow-100 text-yellow-700",
  en_proceso: "bg-blue-100 text-blue-700",
  presupuestada: "bg-purple-100 text-purple-700",
  aceptada: "bg-green-100 text-green-700",
  cerrada: "bg-gray-100 text-gray-600",
};

const tipoLabels = {
  civil: "Civil", penal: "Penal", laboral: "Laboral", familia: "Familia",
  comercial: "Comercial", administrativo: "Administrativo", inmobiliario: "Inmobiliario", otro: "Otro",
};

const requisitosAsunto = {
  civil: ["Escritura original o copia legalizada", "Comprobantes de reclamo previo", "Presupuestos o cotizaciones", "Documentación del contrato en cuestión"],
  penal: ["Denuncia policial o judicial", "Documentación médica (si es relevante)", "Testigos identificados", "Antecedentes penales del denunciado"],
  laboral: ["Recibos de sueldo", "Contrato de trabajo", "Comunicación de despido", "Liquidación final o documentación de aportes"],
  familia: ["Partida de nacimiento/matrimonio/divorcio", "Documentación de patria potestad", "Prueba de ingresos", "Bienes a considerar en división"],
  comercial: ["Escritura constitutiva", "Estatuto social", "Balances contables", "Contratos comerciales relevantes"],
  administrativo: ["Resolución administrativa impugnada", "Solicitudes previas", "Documentación que sustenta la impugnación", "Pruebas de cumplimiento de plazos"],
  inmobiliario: ["Escritura de propiedad", "Plano catastral", "Certificado de dominio", "Documentación de reclamos previos"],
  otro: ["Documentación relevante al caso", "Comunicaciones previas", "Pruebas de reclamo", "Cualquier antecedente útil"],
};

const emptyConsulta = {
  numero: "", fecha: new Date().toISOString().split("T")[0], client_id: "", client_name: "",
  tipo_asunto: "civil", estado: "pendiente", resumen: "", hechos: "", partes: "",
  documentacion: "", jurisdiccion: "", presupuesto_ius: "", presupuesto_pesos: "",
  gastos_estimados: "", notas: "", case_id: "",
};

const TABS = ["datos", "escritos", "presupuesto"];
const TAB_LABELS = { datos: "Datos del cliente", escritos: "Info para escritos", presupuesto: "Presupuesto" };

export default function Consultas() {
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyConsulta);
  const [tab, setTab] = useState("datos");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ full_name: "", phone: "", address: "", ocupacion: "", datos_a_tener_en_cuenta: "" });
  const [tarифаSearch, setTarifaSearch] = useState("");
  const [tarifaCategoryFilter, setTarifaCategoryFilter] = useState("all");
  const [selectedTarifas, setSelectedTarifas] = useState(new Set());
  const [selectedGastos, setSelectedGastos] = useState(new Set());
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const autoSaveTimerRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: consultas = [], isLoading } = useQuery({
    queryKey: ["consultas"],
    queryFn: () => base44.entities.Consulta.list("-created_date"),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: configs = [] } = useQuery({
    queryKey: ["iusconfig"],
    queryFn: () => base44.entities.IusConfig.list("-created_date", 1),
  });

  const { data: tarifas = [] } = useQuery({
    queryKey: ["iustarifas"],
    queryFn: () => base44.entities.IusTarifa.list("concepto"),
  });

  const { data: requisitosData = [] } = useQuery({
    queryKey: ["requisitos"],
    queryFn: () => base44.entities.Requisito.list("orden"),
  });

  const saveBudgetMutation = useMutation({
    mutationFn: (data) => base44.entities.Presupuesto.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["presupuestos"] }),
  });

  const valorBase = configs[0]?.valor_base || 0;

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create({ ...data, status: "activo", client_type: "persona_fisica" }),
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setForm(prev => ({ ...prev, client_id: newClient.id, client_name: newClient.full_name }));
      setClientDialogOpen(false);
      setClientForm({ full_name: "", phone: "", address: "", ocupacion: "", datos_a_tener_en_cuenta: "" });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Consulta.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["consultas"] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Consulta.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["consultas"] }); if (!autoSaveEnabled) closeDialog(); },
  });

  const autoSaveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Consulta.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["consultas"] }); setAutoSaveStatus('saved'); setTimeout(() => setAutoSaveStatus('idle'), 2000); },
    onError: () => { setAutoSaveStatus('error'); setTimeout(() => setAutoSaveStatus('idle'), 2000); },
  });

  useEffect(() => {
    if (!autoSaveEnabled || !editing || autoSaveStatus === 'saving') return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(() => {
      const selectedClient = clients.find(c => c.id === form.client_id);
      const data = {
        ...form,
        client_name: selectedClient?.full_name || form.client_name,
        presupuesto_ius: form.presupuesto_ius ? parseFloat(form.presupuesto_ius) : null,
        presupuesto_pesos: form.presupuesto_pesos ? parseFloat(form.presupuesto_pesos) : null,
        gastos_estimados: form.gastos_estimados ? parseFloat(form.gastos_estimados) : null,
      };
      autoSaveMutation.mutate({ id: editing.id, data });
    }, 1000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [form, autoSaveEnabled, editing, clients]);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Consulta.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consultas"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyConsulta); setTab("datos"); };

  const openNew = () => { setForm(emptyConsulta); setEditing(null); setTab("datos"); setDialogOpen(true); };

  const openEdit = (c) => { setEditing(c); setForm({ ...emptyConsulta, ...c }); setTab("datos"); setDialogOpen(true); };

  const openNewWithIUS = () => { setForm({ ...emptyConsulta, presupuesto_ius: valorBase > 0 ? "1" : "", presupuesto_pesos: valorBase > 0 ? valorBase.toString() : "" }); setEditing(null); setTab("datos"); setDialogOpen(true); };

  const handleSubmit = () => {
    const selectedClient = clients.find(c => c.id === form.client_id);
    const data = {
      ...form,
      client_name: selectedClient?.full_name || form.client_name,
      presupuesto_ius: form.presupuesto_ius ? parseFloat(form.presupuesto_ius) : null,
      presupuesto_pesos: form.presupuesto_pesos ? parseFloat(form.presupuesto_pesos) : null,
      gastos_estimados: form.gastos_estimados ? parseFloat(form.gastos_estimados) : null,
    };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const formatPesos = (n) => n?.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }) || "—";

  const getRequisitos = (tipo) => requisitosData.filter(r => r.tipo_asunto === tipo).sort((a, b) => (a.orden || 0) - (b.orden || 0)).map(r => r.descripcion);

  const filtered = consultas.filter(c => {
    const matchSearch = c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.resumen?.toLowerCase().includes(search.toLowerCase()) ||
      c.numero?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = estadoFilter === "all" || c.estado === estadoFilter;
    return matchSearch && matchEstado;
  });

  const handleIusChange = (val) => {
    setForm(prev => ({
      ...prev,
      presupuesto_ius: val,
      presupuesto_pesos: val && valorBase ? String(parseFloat(val) * valorBase) : prev.presupuesto_pesos,
    }));
  };

  const handlePrintBudget = () => {
    const montoLista = parseFloat(form.presupuesto_pesos) || 0;
    const montoContado = Math.round(montoLista * 0.85);
    const cuota3 = Math.round(montoLista / 3);
    const cuota6 = Math.round(montoLista / 6);
    const hoy = new Date();
    const vencimiento = new Date(hoy.getTime() + 10 * 24 * 60 * 60 * 1000);
    const tipoAsunto = tipoLabels[form.tipo_asunto] || 'Sin especificar';
    const requisitos = getRequisitos(form.tipo_asunto);
    const reqHtml = requisitos.length > 0 ? `<div style="margin:20px 0;padding:15px;background:#f9f9f9;border-left:4px solid #1e3a5f"><p style="margin:0 0 10px;font-weight:bold">Documentación a presentar:</p><ul style="margin:0;padding-left:20px">${requisitos.map(req => `<li style="margin:5px 0">${req}</li>`).join('')}</ul></div>` : '';
    const conceptoSeleccionado = Array.from(selectedTarifas).map(id => tarifas.find(t => t.id === id)?.concepto).filter(Boolean).join(', ') || form.resumen || 'Servicios profesionales';
    
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{font-size:24px;margin:0 0 10px}p{margin:5px 0}.header{border-bottom:3px solid #1e3a5f;padding-bottom:20px;margin-bottom:30px}.client{font-weight:bold;font-size:18px;margin:20px 0}.asunto{margin:15px 0;padding:10px;background:#f0f7ff;border-left:3px solid #1e3a5f}.table{width:100%;border-collapse:collapse;margin:30px 0}.table th{background:#f0f0f0;padding:10px;text-align:left;border-bottom:2px solid #1e3a5f}.table td{padding:10px;border-bottom:1px solid #ddd}.amount{text-align:right;font-weight:bold}.footer{margin-top:40px;font-size:12px;color:#666;border-top:1px solid #ddd;padding-top:20px}</style>
    </head><body>
    <div class="header"><h1>PRESUPUESTO</h1>
    <p><strong>Pérez & Funes - Estudio Jurídico</strong></p>
    <p>Fecha: ${hoy.toLocaleDateString('es-AR')}</p>
    <p>Válido hasta: ${vencimiento.toLocaleDateString('es-AR')} (10 días)</p></div>
    <div class="client">Cliente: ${form.client_name}</div>
    <div class="asunto"><strong>Tipo de asunto:</strong> ${tipoAsunto}</div>
    ${reqHtml}
    <table class="table"><tr><th>Concepto</th><th class="amount">Monto</th></tr>
    <tr><td>${conceptoSeleccionado}</td><td class="amount">$${montoLista.toLocaleString('es-AR')}</td></tr>
    </table>
    <table class="table"><tr><th>Opción de pago</th><th class="amount">Monto</th></tr>
    <tr><td><strong>Contado (15% desc.)</strong></td><td class="amount">$${montoContado.toLocaleString('es-AR')}</td></tr>
    <tr><td><strong>3 cuotas</strong></td><td class="amount">$${cuota3.toLocaleString('es-AR')} c/u</td></tr>
    <tr><td><strong>6 cuotas</strong></td><td class="amount">$${cuota6.toLocaleString('es-AR')} c/u</td></tr>
    </table>
    <div class="footer"><p>Este presupuesto es válido por 10 días corridos desde su emisión.</p>
    <p>Para aceptar, por favor comuníquese con nuestro estudio.</p></div>
    </body></html>`;
    
    saveBudgetMutation.mutate({
      client_id: form.client_id,
      client_name: form.client_name,
      consulta_id: editing?.id || "",
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_vencimiento: vencimiento.toISOString().split('T')[0],
      concepto: form.resumen || 'Servicios profesionales',
      monto_lista: montoLista,
      monto_contado: montoContado,
      cuotas_3: cuota3,
      cuotas_6: cuota6,
      html_content: html,
    });
    
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Consultas</h1>
          <p className="text-muted-foreground mt-1">Gestión de consultas, presupuestos e información para escritos</p>
        </div>
        <Button onClick={valorBase > 0 ? openNewWithIUS : openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva Consulta
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente, resumen, nº..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(estadoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground mt-4">No hay consultas registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Card key={c.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {c.numero && <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">#{c.numero}</span>}
                      <h3 className="font-semibold">{c.client_name}</h3>
                      <Badge className={estadoColors[c.estado]} variant="secondary">{estadoLabels[c.estado]}</Badge>
                      {c.tipo_asunto && <Badge variant="outline" className="text-xs">{tipoLabels[c.tipo_asunto]}</Badge>}
                    </div>
                    {c.resumen && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{c.resumen}</p>}
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                      {c.fecha && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(c.fecha), "d 'de' MMMM yyyy", { locale: es })}
                        </span>
                      )}
                      {c.presupuesto_pesos && (
                        <span className="flex items-center gap-1 text-green-700 font-medium">
                          <Calculator className="w-3 h-3" />
                          {formatPesos(c.presupuesto_pesos)}
                        </span>
                      )}
                      {c.jurisdiccion && <span>· {c.jurisdiccion}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
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

      {/* Dialog Nuevo Cliente Rápido */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nombre y Apellido *</Label>
              <Input placeholder="Ej: Juan Pérez" value={clientForm.full_name} onChange={e => setClientForm({ ...clientForm, full_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Teléfono</Label>
                <Input placeholder="Ej: 3424 123456" value={clientForm.phone} onChange={e => setClientForm({ ...clientForm, phone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Ocupación</Label>
                <Input placeholder="Ej: Comerciante" value={clientForm.ocupacion} onChange={e => setClientForm({ ...clientForm, ocupacion: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Domicilio</Label>
              <Input placeholder="Calle, número, localidad" value={clientForm.address} onChange={e => setClientForm({ ...clientForm, address: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Datos a tener en cuenta</Label>
              <Textarea placeholder="Información relevante: antecedentes, situación particular, etc." value={clientForm.datos_a_tener_en_cuenta} onChange={e => setClientForm({ ...clientForm, datos_a_tener_en_cuenta: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createClientMutation.mutate(clientForm)} disabled={!clientForm.full_name}>
              Crear Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Consulta */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <div className="flex items-center justify-between">
             <DialogTitle className="font-serif">{editing ? "Editar Consulta" : "Nueva Consulta"}</DialogTitle>
             {editing && (
               <div className="flex items-center gap-2 text-xs">
                 <label className="flex items-center gap-1 cursor-pointer">
                   <input type="checkbox" checked={autoSaveEnabled} onChange={(e) => setAutoSaveEnabled(e.target.checked)} className="rounded" />
                   <span>Auto-guardar</span>
                 </label>
                 {autoSaveStatus === 'saving' && <span className="text-muted-foreground">Guardando...</span>}
                 {autoSaveStatus === 'saved' && <span className="text-green-600 font-medium">✓ Guardado</span>}
                 {autoSaveStatus === 'error' && <span className="text-destructive font-medium">Error</span>}
               </div>
             )}
           </div>
         </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b mb-4">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {tab === "datos" && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nº de Consulta</Label>
                  <Input placeholder="Ej: 2026-001" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Fecha *</Label>
                  <Input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Cliente *</Label>
                  <div className="flex gap-2">
                    <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" title="Nuevo cliente" onClick={() => setClientDialogOpen(true)}>
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo de asunto</Label>
                  <Select value={form.tipo_asunto} onValueChange={v => setForm({ ...form, tipo_asunto: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(tipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form.tipo_asunto && getRequisitos(form.tipo_asunto).length > 0 && (
                    <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-2">Requisitos a presentar:</p>
                      <ul className="text-xs text-blue-800 space-y-1">
                        {getRequisitos(form.tipo_asunto).map((req, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold mt-0.5">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(estadoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Resumen del caso</Label>
                <Textarea placeholder="Descripción breve del planteo del cliente..." value={form.resumen} onChange={e => setForm({ ...form, resumen: e.target.value })} rows={4} />
              </div>
              <div className="grid gap-2">
                <Label>Notas internas</Label>
                <Textarea placeholder="Observaciones del estudio..." value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} />
              </div>
            </div>
          )}

          {tab === "escritos" && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Partes involucradas</Label>
                <Textarea placeholder="Actor: Juan Pérez&#10;Demandado: María García&#10;Testigos: ..." value={form.partes} onChange={e => setForm({ ...form, partes: e.target.value })} rows={3} />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-1">
                  <Label>Relato de hechos</Label>
                </div>
                <AudioTranscriber
                  onTranscript={(text) =>
                    setForm(prev => ({ ...prev, hechos: prev.hechos ? prev.hechos + " " + text : text }))
                  }
                />
                <Textarea
                  placeholder="Descripción detallada y cronológica de los hechos para los escritos judiciales..."
                  value={form.hechos}
                  onChange={e => setForm({ ...form, hechos: e.target.value })}
                  rows={8}
                />
              </div>
              <div className="grid gap-2">
                <Label>Documentación</Label>
                <Textarea placeholder="Documentos presentados o requeridos: contratos, recibos, certificados..." value={form.documentacion} onChange={e => setForm({ ...form, documentacion: e.target.value })} rows={3} />
              </div>
              <div className="grid gap-2">
                <Label>Jurisdicción / Juzgado</Label>
                <Input placeholder="Ej: Juzgado Civil Nº 5 de Santa Fe" value={form.jurisdiccion} onChange={e => setForm({ ...form, jurisdiccion: e.target.value })} />
              </div>
              {form.tipo_asunto && getRequisitos(form.tipo_asunto).length > 0 && (
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 space-y-2">
                  <p className="text-sm font-semibold text-yellow-900">Documentación solicitada para {tipoLabels[form.tipo_asunto]}:</p>
                  <ul className="text-sm text-yellow-800 space-y-1.5">
                    {getRequisitos(form.tipo_asunto).map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold mt-0.5">✓</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {tab === "presupuesto" && (
            <div className="grid gap-4">
              {form.tipo_asunto && getRequisitos(form.tipo_asunto).length > 0 && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-2">
                  <p className="text-sm font-semibold text-green-900">Documentación requerida para {tipoLabels[form.tipo_asunto]}:</p>
                  <ul className="text-sm text-green-800 space-y-1.5">
                    {getRequisitos(form.tipo_asunto).map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {valorBase > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                  <span className="text-muted-foreground">Valor IUS vigente: </span>
                  <span className="font-semibold text-primary">{formatPesos(valorBase)}</span>
                  <span className="text-muted-foreground ml-2 text-xs">(los pesos se calculan automáticamente)</span>
                </div>
              )}
              {tarifas.length > 0 && (
                <div className="grid gap-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Conceptos de la Tabla IUS</Label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input
                      placeholder="Buscar concepto..."
                      value={tarифаSearch}
                      onChange={(e) => setTarifaSearch(e.target.value)}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Select value={tarifaCategoryFilter} onValueChange={setTarifaCategoryFilter}>
                        <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="consulta">Consulta</SelectItem>
                          <SelectItem value="asesoria">Asesoría</SelectItem>
                          <SelectItem value="defensa">Defensa</SelectItem>
                          <SelectItem value="redaccion">Redacción</SelectItem>
                          <SelectItem value="mediacion">Mediación</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedTarifas.size > 0 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedTarifas(new Set()); handleIusChange(""); }} className="text-xs h-auto px-2">
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {tarifas.filter(t => t.activo && (tarифаSearch === "" || t.concepto.toLowerCase().includes(tarифаSearch.toLowerCase()) || t.descripcion?.toLowerCase().includes(tarифаSearch.toLowerCase())) && (tarifaCategoryFilter === "all" || t.categoria === tarifaCategoryFilter)).map(t => {
                      const isSelected = selectedTarifas.has(t.id);
                      return (
                     <div key={t.id} className={`px-3 py-2 transition-colors flex items-center gap-2 text-sm rounded ${isSelected ? 'bg-primary/10 border-l-4 border-primary font-semibold' : 'hover:bg-accent/50'}`}>
                       <input
                         type="checkbox"
                         checked={isSelected}
                         onChange={(e) => {
                           const newSelected = new Set(selectedTarifas);
                           if (e.target.checked) {
                             newSelected.add(t.id);
                           } else {
                             newSelected.delete(t.id);
                           }
                           setSelectedTarifas(newSelected);
                           const totalIus = Array.from(newSelected).reduce((sum, id) => sum + (tarifas.find(tf => tf.id === id)?.multiplicador || 0), 0);
                           handleIusChange(totalIus > 0 ? totalIus.toString() : "");
                         }}
                         className="rounded"
                       />
                       <div className="flex-1 min-w-0">
                         <p className="font-medium truncate">{t.concepto}</p>
                         {t.descripcion && <p className="text-xs text-muted-foreground line-clamp-1">{t.descripcion}</p>}
                       </div>
                       <div className="shrink-0 text-right">
                         <p className="font-semibold text-primary text-sm">{t.multiplicador} IUS</p>
                         {valorBase > 0 && <p className="text-xs text-muted-foreground">{formatPesos(t.multiplicador * valorBase)}</p>}
                       </div>
                     </div>
                    );
                    })}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Honorarios en IUS</Label>
                    {valorBase > 0 && <p className="text-xs text-muted-foreground">Vigente: {formatPesos(valorBase)}</p>}
                  </div>
                  <Input type="number" min="0" step="0.5" placeholder="Cantidad de IUS" value={form.presupuesto_ius} onChange={e => handleIusChange(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Honorarios en pesos ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                    <Input 
                      type="text" 
                      placeholder="0" 
                      value={form.presupuesto_pesos ? parseInt(form.presupuesto_pesos).toLocaleString('es-AR') : ''}
                      onChange={e => setForm({ ...form, presupuesto_pesos: Math.round(parseFloat(e.target.value.replace(/\./g, '')) || 0).toString() })
                      } 
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Gastos estimados ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input 
                    type="text" 
                    placeholder="0" 
                    value={form.gastos_estimados ? parseInt(form.gastos_estimados).toLocaleString('es-AR') : ''}
                    onChange={e => setForm({ ...form, gastos_estimados: Math.round(parseFloat(e.target.value.replace(/\./g, '')) || 0).toString() })}
                    className="pl-8"
                  />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded border">
                    <input
                      type="checkbox"
                      id="gasto-inicio"
                      checked={selectedGastos.has('inicio')}
                      onChange={(e) => {
                        const newGastos = new Set(selectedGastos);
                        let total = parseFloat(form.gastos_estimados) || 0;
                        if (e.target.checked) {
                          newGastos.add('inicio');
                          total += 20000;
                        } else {
                          newGastos.delete('inicio');
                          total -= 20000;
                        }
                        setSelectedGastos(newGastos);
                        setForm({ ...form, gastos_estimados: String(Math.round(total)) });
                      }}
                      className="rounded"
                    />
                    <label htmlFor="gasto-inicio" className="flex-1 cursor-pointer font-medium">Inicio de Causa: $20.000</label>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded border">
                    <input
                      type="checkbox"
                      id="gasto-desarchivo"
                      checked={selectedGastos.has('desarchivo')}
                      onChange={(e) => {
                        const newGastos = new Set(selectedGastos);
                        let total = parseFloat(form.gastos_estimados) || 0;
                        if (e.target.checked) {
                          newGastos.add('desarchivo');
                          total += 70000;
                        } else {
                          newGastos.delete('desarchivo');
                          total -= 70000;
                        }
                        setSelectedGastos(newGastos);
                        setForm({ ...form, gastos_estimados: String(Math.round(total)) });
                      }}
                      className="rounded"
                    />
                    <label htmlFor="gasto-desarchivo" className="flex-1 cursor-pointer font-medium">Desarchivo: $70.000</label>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded border">
                    <input
                      type="checkbox"
                      id="gasto-aporte"
                      checked={selectedGastos.has('aporte')}
                      onChange={(e) => {
                        const newGastos = new Set(selectedGastos);
                        let total = parseFloat(form.gastos_estimados) || 0;
                        if (e.target.checked) {
                          newGastos.add('aporte');
                          total += 8000;
                        } else {
                          newGastos.delete('aporte');
                          total -= 8000;
                        }
                        setSelectedGastos(newGastos);
                        setForm({ ...form, gastos_estimados: String(Math.round(total)) });
                      }}
                      className="rounded"
                    />
                    <label htmlFor="gasto-aporte" className="flex-1 cursor-pointer font-medium">Aporte al Colegio: $8.000</label>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Tasas Judiciales (definir monto)</Label>
                  <Input type="number" min="0" step="1" placeholder="Ingresar monto" className="text-xs" onBlur={(e) => { const val = parseFloat(e.target.value); if (val > 0) { setForm({ ...form, gastos_estimados: String((parseFloat(form.gastos_estimados) || 0) + val) }); e.target.value = ""; } }} />
                </div>
              </div>
              {form.presupuesto_pesos && form.client_id && (
                <Button onClick={handlePrintBudget} className="gap-2 w-full" disabled={saveBudgetMutation.isPending}>
                  <Printer className="w-4 h-4" /> {saveBudgetMutation.isPending ? 'Guardando...' : 'Imprimir y guardar presupuesto'}
                </Button>
              )}
              {(form.presupuesto_pesos || form.gastos_estimados) && (
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 space-y-1">
                  <p className="text-sm font-medium">Resumen del presupuesto</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Honorarios</span>
                    <span>{formatPesos(parseFloat(form.presupuesto_pesos) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gastos estimados</span>
                    <span>{formatPesos(parseFloat(form.gastos_estimados) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                    <span>Total estimado</span>
                    <span className="text-primary">{formatPesos((parseFloat(form.presupuesto_pesos) || 0) + (parseFloat(form.gastos_estimados) || 0))}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.client_id && !form.client_name}>
              {editing ? "Guardar Cambios" : "Crear Consulta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}