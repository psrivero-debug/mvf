import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Printer, Trash2, Receipt, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formaPagoLabels = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  cheque: "Cheque",
  otro: "Otro",
};

const formaPagoColors = {
  efectivo: "bg-green-100 text-green-700",
  transferencia: "bg-blue-100 text-blue-700",
  cheque: "bg-yellow-100 text-yellow-700",
  otro: "bg-gray-100 text-gray-600",
};

const emptyForm = {
  numero: "",
  fecha: new Date().toISOString().split("T")[0],
  client_id: "",
  client_name: "",
  concepto: "",
  monto: "",
  forma_pago: "efectivo",
  notas: "",
};

const formatPesos = (n) =>
  n?.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }) || "—";

function imprimirRecibo(recibo) {
  const hoy = new Date(recibo.fecha + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const montoLetras = recibo.monto?.toLocaleString("es-AR");
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #fff; color: #222; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-area h1 { font-size: 22px; font-weight: bold; color: #1e3a5f; }
    .logo-area p { font-size: 12px; color: #666; margin-top: 3px; }
    .recibo-badge { background: #1e3a5f; color: white; padding: 8px 20px; border-radius: 6px; text-align: center; }
    .recibo-badge h2 { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
    .recibo-badge p { font-size: 12px; margin-top: 2px; opacity: 0.85; }
    .body { margin: 30px 0; }
    .row { display: flex; gap: 20px; margin-bottom: 18px; }
    .field { flex: 1; }
    .field label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #888; letter-spacing: 1px; display: block; margin-bottom: 5px; }
    .field .value { font-size: 14px; color: #222; border-bottom: 1px solid #ddd; padding-bottom: 4px; min-height: 24px; }
    .monto-box { background: #f0f7ff; border: 2px solid #1e3a5f; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
    .monto-box .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .monto-box .amount { font-size: 32px; font-weight: bold; color: #1e3a5f; margin: 8px 0; }
    .monto-box .en-letras { font-size: 13px; color: #444; font-style: italic; }
    .concepto-box { background: #f9f9f9; border-left: 4px solid #1e3a5f; padding: 15px 20px; border-radius: 0 6px 6px 0; margin: 20px 0; }
    .concepto-box label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #888; letter-spacing: 1px; display: block; margin-bottom: 5px; }
    .concepto-box p { font-size: 14px; color: #222; }
    .firmas { display: flex; justify-content: space-between; margin-top: 60px; }
    .firma { text-align: center; width: 200px; }
    .firma .linea { border-top: 1px solid #444; padding-top: 8px; font-size: 12px; color: #555; }
    .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 11px; color: #999; text-align: center; }
    @media print { body { margin: 0; } .page { padding: 20px; max-width: 100%; } }
  </style>
  </head><body>
  <div class="page">
    <div class="header">
      <div class="logo-area">
        <h1>Pérez &amp; Funes</h1>
        <p>Estudio Jurídico · Negocios Inmobiliarios</p>
        <p style="margin-top:6px;font-size:11px;color:#888;">San Luis, Argentina</p>
      </div>
      <div class="recibo-badge">
        <h2>RECIBO</h2>
        <p>Nº ${recibo.numero || "—"}</p>
      </div>
    </div>
    <div class="body">
      <div class="row">
        <div class="field">
          <label>Fecha</label>
          <div class="value">${hoy}</div>
        </div>
        <div class="field">
          <label>Forma de pago</label>
          <div class="value">${formaPagoLabels[recibo.forma_pago] || recibo.forma_pago}</div>
        </div>
      </div>
      <div class="field" style="margin-bottom:18px">
        <label>Recibimos de</label>
        <div class="value" style="font-size:16px;font-weight:bold">${recibo.client_name}</div>
      </div>
      <div class="concepto-box">
        <label>En concepto de</label>
        <p>${recibo.concepto}</p>
      </div>
      <div class="monto-box">
        <div class="label">La suma de</div>
        <div class="amount">${formatPesos(recibo.monto)}</div>
        <div class="en-letras">Pesos: ${montoLetras}</div>
      </div>
      ${recibo.notas ? `<div style="margin-top:15px;font-size:12px;color:#666"><strong>Observaciones:</strong> ${recibo.notas}</div>` : ""}
    </div>
    <div class="firmas">
      <div class="firma">
        <div class="linea">Firma del receptor</div>
      </div>
      <div class="firma">
        <div class="linea">Aclaración</div>
      </div>
      <div class="firma">
        <div class="linea">Sello del estudio</div>
      </div>
    </div>
    <div class="footer">
      Pérez &amp; Funes — Estudio Jurídico · Recibo emitido en San Luis · Este documento es válido como comprobante de pago
    </div>
  </div>
  </body></html>`);
  w.document.close();
  w.print();
}

export default function Recibos() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data: recibos = [], isLoading } = useQuery({
    queryKey: ["recibos"],
    queryFn: () => base44.entities.Recibo.list("-created_date"),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("full_name"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Recibo.create(data),
    onSuccess: (recibo) => {
      queryClient.invalidateQueries({ queryKey: ["recibos"] });
      setDialogOpen(false);
      setForm(emptyForm);
      imprimirRecibo(recibo);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Recibo.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recibos"] }),
  });

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setForm(prev => ({ ...prev, client_id: clientId, client_name: client?.full_name || "" }));
  };

  const handleSubmit = () => {
    const data = { ...form, monto: parseFloat(form.monto) || 0 };
    createMutation.mutate(data);
  };

  const filtered = recibos.filter(r =>
    r.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.concepto?.toLowerCase().includes(search.toLowerCase()) ||
    r.numero?.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupar por cliente para mostrar historial
  const totalGeneral = filtered.reduce((sum, r) => sum + (r.monto || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Recibos</h1>
          <p className="text-muted-foreground mt-1">Emisión y registro de recibos de pago por cliente</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Emitir Recibo
        </Button>
      </div>

      {/* Buscador y resumen */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, concepto, nº..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {filtered.length > 0 && (
          <div className="text-sm text-muted-foreground px-3 py-1.5 bg-muted rounded-lg">
            <span className="font-semibold text-foreground">{filtered.length}</span> recibos ·{" "}
            <span className="font-semibold text-green-700">{formatPesos(totalGeneral)}</span> total
          </div>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-14 text-center">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No hay recibos registrados</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Emití el primero con el botón de arriba</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <Card key={r.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {r.numero && (
                          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            #{r.numero}
                          </span>
                        )}
                        <span className="font-semibold">{r.client_name}</span>
                        <Badge className={formaPagoColors[r.forma_pago]} variant="secondary">
                          {formaPagoLabels[r.forma_pago]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{r.concepto}</p>
                      <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-muted-foreground">
                        {r.fecha && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(r.fecha + "T12:00:00"), "d 'de' MMMM yyyy", { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-lg font-bold text-green-700">{formatPesos(r.monto)}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => imprimirRecibo(r)}
                      >
                        <Printer className="w-3.5 h-3.5" /> Imprimir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(r.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog nuevo recibo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Receipt className="w-5 h-5" /> Emitir Recibo
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nº de Recibo</Label>
                <Input
                  placeholder="Ej: 2026-001"
                  value={form.numero}
                  onChange={e => setForm({ ...form, numero: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Cliente *</Label>
              <Select value={form.client_id} onValueChange={handleClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {c.full_name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Concepto *</Label>
              <Textarea
                placeholder="Ej: Honorarios por demanda laboral, cuota Nº 1..."
                value={form.concepto}
                onChange={e => setForm({ ...form, concepto: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Monto ($) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    value={form.monto}
                    onChange={e => setForm({ ...form, monto: e.target.value })}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Forma de pago</Label>
                <Select value={form.forma_pago} onValueChange={v => setForm({ ...form, forma_pago: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(formaPagoLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observaciones</Label>
              <Input
                placeholder="Notas adicionales (opcional)"
                value={form.notas}
                onChange={e => setForm({ ...form, notas: e.target.value })}
              />
            </div>
            {form.monto && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                <p className="text-xs text-green-600 mb-1">Monto a recibir</p>
                <p className="text-2xl font-bold text-green-700">{formatPesos(parseFloat(form.monto))}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setForm(emptyForm); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.client_id || !form.concepto || !form.monto || createMutation.isPending}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              {createMutation.isPending ? "Guardando..." : "Guardar e Imprimir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}