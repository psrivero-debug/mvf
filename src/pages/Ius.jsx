import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Calculator, TrendingUp, Save, CheckSquare, Printer, ArrowLeft, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import IusAgentChat from "@/components/ius/IusAgentChat";

const categoriaLabels = {
  consulta: "Consulta",
  asesoria: "Asesoría",
  defensa: "Defensa",
  redaccion: "Redacción",
  mediacion: "Mediación",
  otro: "Otro",
};

const categoriaColors = {
  consulta: "bg-blue-100 text-blue-700",
  asesoria: "bg-purple-100 text-purple-700",
  defensa: "bg-red-100 text-red-700",
  redaccion: "bg-green-100 text-green-700",
  mediacion: "bg-orange-100 text-orange-700",
  otro: "bg-gray-100 text-gray-600",
};

const emptyTarifa = { concepto: "", categoria: "consulta", multiplicador: "", descripcion: "", activo: true };

export default function Ius() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchConcepto, setSearchConcepto] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyTarifa);
  const [editingBase, setEditingBase] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [baseForm, setBaseForm] = useState({ valor_base: "", descripcion: "", fecha_vigencia: "" });
  const [editingIusId, setEditingIusId] = useState(null);
  const [editingIusValue, setEditingIusValue] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const { data: configs = [] } = useQuery({
    queryKey: ["iusconfig"],
    queryFn: () => base44.entities.IusConfig.list("-created_date", 1),
  });

  const { data: tarifas = [], isLoading } = useQuery({
    queryKey: ["iustarifas"],
    queryFn: () => base44.entities.IusTarifa.list("concepto"),
  });

  const config = configs[0];
  const valorBase = config?.valor_base || 0;

  const saveConfigMutation = useMutation({
    mutationFn: async (data) => {
      if (config) return base44.entities.IusConfig.update(config.id, data);
      return base44.entities.IusConfig.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iusconfig"] });
      setEditingBase(false);
    },
  });

  const createTarifa = useMutation({
    mutationFn: (data) => base44.entities.IusTarifa.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["iustarifas"] }); closeDialog(); },
  });

  const updateTarifa = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IusTarifa.update(id, data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["iustarifas"] }); 
      closeDialog();
      setEditingIusId(null);
    },
  });

  const deleteTarifa = useMutation({
    mutationFn: (id) => base44.entities.IusTarifa.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["iustarifas"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyTarifa); };

  const openEdit = (t) => { setEditing(t); setForm({ ...emptyTarifa, ...t }); setDialogOpen(true); };

  const openEditBase = () => {
    setBaseForm({
      valor_base: config?.valor_base || "",
      descripcion: config?.descripcion || "",
      fecha_vigencia: config?.fecha_vigencia || "",
    });
    setEditingBase(true);
  };

  const handlePrint = () => {
    const filas = selectedTarifas.map(t => `
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:8px 12px">${t.concepto}</td>
        <td style="padding:8px 12px">${categoriaLabels[t.categoria] || t.categoria}</td>
        <td style="padding:8px 12px;text-align:right">${t.multiplicador} IUS</td>
        <td style="padding:8px 12px;text-align:right">${valorBase > 0 ? (valorBase * t.multiplicador).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }) : '—'}</td>
      </tr>
    `).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tabla IUS - Pérez & Funes</title>
    <style>body{font-family:serif;padding:32px;color:#1e293b}h1{font-size:22px;margin-bottom:4px}p{margin:0 0 4px;font-size:13px;color:#64748b}table{width:100%;border-collapse:collapse;margin-top:20px}thead tr{background:#1e3a5f;color:white}th{padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em}tbody tr:nth-child(even){background:#f8fafc}tfoot tr{background:#f1f5f9;font-weight:700;border-top:2px solid #cbd5e1}</style>
    </head><body>
    <h1>Pérez & Funes — Tabla de Honorarios IUS</h1>
    <p>Valor IUS: ${valorBase > 0 ? valorBase.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }) : 'Sin configurar'} — ${config?.fecha_vigencia || ''} ${config?.descripcion ? '(' + config.descripcion + ')' : ''}</p>
    <p>Generado: ${new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })}</p>
    <table><thead><tr><th>Concepto</th><th>Categoría</th><th style="text-align:right">IUS</th><th style="text-align:right">Valor estimado</th></tr></thead>
    <tbody>${filas}</tbody>
    <tfoot><tr><td colspan="2" style="padding:8px 12px">${selectedIds.size > 0 ? 'Total seleccionados (' + selectedIds.size + ')' : 'Total general'}</td><td style="padding:8px 12px;text-align:right">${totalIus} IUS</td><td style="padding:8px 12px;text-align:right">${valorBase > 0 ? (valorBase * totalIus).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }) : '—'}</td></tr></tfoot>
    </table></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  const handleSubmitTarifa = () => {
    const data = { ...form, multiplicador: parseFloat(form.multiplicador) };
    if (editing) updateTarifa.mutate({ id: editing.id, data });
    else createTarifa.mutate(data);
  };

  const formatPesos = (n) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

  const tarifasFiltradas = tarifas.filter(t => {
    const matchConcepto = t.concepto?.toLowerCase().includes(searchConcepto.toLowerCase()) ||
      t.descripcion?.toLowerCase().includes(searchConcepto.toLowerCase());
    const matchCat = filterCategoria === "all" || t.categoria === filterCategoria;
    return matchConcepto && matchCat;
  });

  const toggleSelected = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (tarifasFiltradas.every(t => selectedIds.has(t.id))) {
      setSelectedIds(prev => { const next = new Set(prev); tarifasFiltradas.forEach(t => next.delete(t.id)); return next; });
    } else {
      setSelectedIds(prev => { const next = new Set(prev); tarifasFiltradas.forEach(t => next.add(t.id)); return next; });
    }
  };

  const selectedTarifas = selectedIds.size > 0 ? tarifas.filter(t => selectedIds.has(t.id)) : tarifasFiltradas;
  const totalIus = selectedTarifas.reduce((acc, t) => acc + (t.multiplicador || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div className="flex items-center gap-3">
           <Link to="/">
             <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
               <ArrowLeft className="w-4 h-4" /> Panel
             </Button>
           </Link>
           <div>
             <h1 className="text-2xl lg:text-3xl font-serif font-bold">Tabla de IUS</h1>
             <p className="text-muted-foreground mt-1">Aranceles calculados sobre el valor unitario del IUS</p>
           </div>
         </div>
         <div className="flex gap-2">
           <Button variant="outline" onClick={() => setChatOpen(!chatOpen)} className="gap-2">
             <MessageCircle className="w-4 h-4" /> Asistente IA
           </Button>
           <Button variant="outline" onClick={handlePrint} className="gap-2">
             <Printer className="w-4 h-4" /> Imprimir {selectedIds.size > 0 ? `(${selectedIds.size})` : "tabla"}
           </Button>
           <Button onClick={() => { setForm(emptyTarifa); setEditing(null); setDialogOpen(true); }} className="gap-2">
             <Plus className="w-4 h-4" /> Nuevo Concepto
           </Button>
         </div>
       </div>

      {/* VALOR BASE IUS */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          {editingBase ? (
            <div className="space-y-4">
              <p className="font-serif text-lg font-semibold">Actualizar Valor Base del IUS</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-primary-foreground/80 text-xs">Valor 1 IUS ($)</Label>
                  <Input
                    type="number"
                    value={baseForm.valor_base}
                    onChange={e => setBaseForm({ ...baseForm, valor_base: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-primary-foreground/80 text-xs">Fecha de vigencia</Label>
                  <Input
                    type="date"
                    value={baseForm.fecha_vigencia}
                    onChange={e => setBaseForm({ ...baseForm, fecha_vigencia: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-primary-foreground/80 text-xs">Observaciones</Label>
                  <Input
                    value={baseForm.descripcion}
                    onChange={e => setBaseForm({ ...baseForm, descripcion: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    placeholder="Ej: Actualización abril 2026"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="gap-1" onClick={() => saveConfigMutation.mutate({ ...baseForm, valor_base: parseFloat(baseForm.valor_base) })}>
                  <Save className="w-3.5 h-3.5" /> Guardar
                </Button>
                <Button size="sm" variant="ghost" className="text-white/70 hover:text-white" onClick={() => setEditingBase(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Calculator className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <p className="text-primary-foreground/70 text-sm">Valor Unitario del IUS</p>
                  <p className="font-serif text-4xl font-bold text-accent">
                    {valorBase ? formatPesos(valorBase) : "— Sin configurar"}
                  </p>
                  {config?.fecha_vigencia && (
                    <p className="text-primary-foreground/60 text-xs mt-1">Vigente desde: {config.fecha_vigencia}</p>
                  )}
                  {config?.descripcion && (
                    <p className="text-primary-foreground/60 text-xs">{config.descripcion}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-primary-foreground/60 text-xs">
                    {selectedIds.size > 0 ? `Total (${selectedIds.size} seleccionados)` : "Total IUS en tabla"}
                  </p>
                  <p className="font-serif text-2xl font-bold">{totalIus}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={openEditBase} className="gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Actualizar valor
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Buscar concepto..."
            value={searchConcepto}
            onChange={e => setSearchConcepto(e.target.value)}
            className="w-full border border-input rounded-md px-3 py-2 pl-9 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(categoriaLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedIds.size > 0 && (
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())} className="text-xs gap-1 shrink-0">
            <CheckSquare className="w-3.5 h-3.5" /> Limpiar selección ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* TABLA DE TARIFAS */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : tarifas.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Calculator className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground mt-4">No hay conceptos definidos aún</p>
            <p className="text-sm text-muted-foreground">Agregá los servicios del estudio con su valor en IUS</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">Aranceles por Concepto</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={tarifasFiltradas.length > 0 && tarifasFiltradas.every(t => selectedIds.has(t.id))}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="text-left px-5 py-3 font-medium">Concepto</th>
                  <th className="text-left px-5 py-3 font-medium">Categoría</th>
                  <th className="text-right px-5 py-3 font-medium">IUS <span className="text-[10px] font-normal text-muted-foreground">(clic para editar)</span></th>
                  <th className="text-right px-5 py-3 font-medium">Valor estimado</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tarifasFiltradas.map(t => (
                  <tr key={t.id} className={`hover:bg-muted/30 transition-colors group ${selectedIds.has(t.id) ? "bg-accent/10" : ""}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelected(t.id)}
                      />
                    </td>
                    <td className="px-5 py-4">
                       <p className="font-medium text-foreground">{t.concepto}</p>
                      {t.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{t.descripcion}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={categoriaColors[t.categoria]} variant="secondary">
                        {categoriaLabels[t.categoria] || t.categoria}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {editingIusId === t.id ? (
                        <div className="flex gap-1 items-center justify-end">
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={editingIusValue}
                            onChange={e => setEditingIusValue(e.target.value)}
                            className="w-16 h-7 text-right text-sm"
                            autoFocus
                            onBlur={() => {
                              if (editingIusValue && editingIusValue !== String(t.multiplicador)) {
                                updateTarifa.mutate({ id: t.id, data: { ...t, multiplicador: parseFloat(editingIusValue) } });
                              } else {
                                setEditingIusId(null);
                              }
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                if (editingIusValue && editingIusValue !== String(t.multiplicador)) {
                                  updateTarifa.mutate({ id: t.id, data: { ...t, multiplicador: parseFloat(editingIusValue) } });
                                } else {
                                  setEditingIusId(null);
                                }
                              }
                              if (e.key === 'Escape') setEditingIusId(null);
                            }}
                          />
                          <span className="text-muted-foreground text-xs">IUS</span>
                        </div>
                      ) : (
                        <div className="cursor-pointer group">
                          <div onClick={() => { setEditingIusId(t.id); setEditingIusValue(String(t.multiplicador)); }}>
                            <span className="font-mono font-semibold text-primary text-base group-hover:text-accent transition-colors">{t.multiplicador}</span>
                            <span className="text-muted-foreground text-xs ml-1">IUS</span>
                          </div>
                          {t.updated_date && (
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                              {new Date(t.updated_date).toLocaleDateString('es-AR')}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {valorBase > 0 ? (
                        <span className="font-semibold text-accent-foreground">
                          {formatPesos(valorBase * t.multiplicador)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(t)} className="h-7 w-7 p-0">
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteTarifa.mutate(t.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {valorBase > 0 && (
                <tfoot>
                  <tr className="bg-muted/40 border-t-2 border-border font-semibold">
                    <td className="px-4 py-3" />
                    <td className="px-5 py-3 text-sm">
                      {selectedIds.size > 0 ? `Total (${selectedIds.size} seleccionados)` : "Total general"}
                    </td>
                    <td />
                    <td className="px-5 py-3 text-right font-mono text-primary">{totalIus} IUS</td>
                    <td className="px-5 py-3 text-right text-accent-foreground">{formatPesos(valorBase * totalIus)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}

      {/* CHAT AGENTE */}
      {chatOpen && <IusAgentChat onClose={() => setChatOpen(false)} />}

       {/* DIALOG NUEVA / EDITAR TARIFA */}
       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Editar Concepto" : "Nuevo Concepto IUS"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Concepto / Servicio *</Label>
              <Input value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} placeholder="Ej: Consulta inicial" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoría</Label>
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoriaLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Cantidad de IUS *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.multiplicador}
                  onChange={e => setForm({ ...form, multiplicador: e.target.value })}
                  placeholder="Ej: 5"
                />
              </div>
            </div>
            {form.multiplicador && valorBase > 0 && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-xs text-muted-foreground mb-0.5">Valor estimado</p>
                <p className="font-serif text-lg font-bold text-accent-foreground">
                  {parseFloat(form.multiplicador) > 0 ? formatPesos(valorBase * parseFloat(form.multiplicador)) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{form.multiplicador} IUS × {formatPesos(valorBase)}</p>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Descripción (opcional)</Label>
              <Input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalle del servicio..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSubmitTarifa} disabled={!form.concepto || !form.multiplicador}>
              {editing ? "Guardar Cambios" : "Agregar Concepto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}