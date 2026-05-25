import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, FileCheck, AlertCircle } from "lucide-react";
import VistaFactura from "./VistaFactura";

const emptyItem = () => ({ descripcion: "", cantidad: 1, precio_unitario: 0, subtotal: 0 });

export default function NuevaFactura({ config }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    cliente_nombre: "",
    cliente_cuit_dni: "",
    cliente_condicion_iva: "consumidor_final",
    cliente_domicilio: "",
    concepto: "servicios",
    forma_pago: "transferencia",
    cae: "",
    cae_vencimiento: "",
    notas: "",
    fecha_emision: new Date().toISOString().split("T")[0],
  });
  const [items, setItems] = useState([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const [facturaEmitida, setFacturaEmitida] = useState(null);

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      const cant = parseFloat(next[idx].cantidad) || 0;
      const pu = parseFloat(next[idx].precio_unitario) || 0;
      next[idx].subtotal = cant * pu;
      return next;
    });
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotalTotal = items.reduce((acc, i) => acc + (parseFloat(i.subtotal) || 0), 0);
  const total = subtotalTotal;

  const handleEmitir = async () => {
    if (!config) {
      alert("Primero configurá los datos del emisor en la pestaña Configuración.");
      return;
    }
    if (form.cliente_condicion_iva !== "consumidor_final" && !form.cliente_nombre) {
      alert("Ingresá el nombre del cliente.");
      return;
    }
    if (items.some(i => !i.descripcion || !i.precio_unitario)) {
      alert("Completá todos los items con descripción y precio.");
      return;
    }

    setLoading(true);
    const nuevoNumero = (parseInt(config.ultimo_numero) || 0) + 1;
    const factura = {
      ...form,
      numero: String(nuevoNumero).padStart(8, "0"),
      punto_venta: config.punto_venta || "0001",
      items,
      subtotal: subtotalTotal,
      descuento: 0,
      total,
      estado: "emitida",
    };

    const creada = await base44.entities.FacturaC.create(factura);
    await base44.entities.ConfigFacturacion.update(config.id, { ultimo_numero: nuevoNumero });

    queryClient.invalidateQueries({ queryKey: ["facturas_c"] });
    queryClient.invalidateQueries({ queryKey: ["config_facturacion"] });

    setFacturaEmitida(creada);
    setLoading(false);
  };

  if (facturaEmitida) {
    return (
      <VistaFactura
        factura={facturaEmitida}
        config={config}
        onClose={() => {
          setFacturaEmitida(null);
          setForm({
            cliente_nombre: "", cliente_cuit_dni: "", cliente_condicion_iva: "consumidor_final",
            cliente_domicilio: "", concepto: "servicios", forma_pago: "transferencia",
            cae: "", cae_vencimiento: "", notas: "",
            fecha_emision: new Date().toISOString().split("T")[0],
          });
          setItems([emptyItem()]);
        }}
      />
    );
  }

  if (!config) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm">Primero configurá los datos del emisor en la pestaña <strong>Configuración</strong>.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Datos emisor resumen */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span><strong>Emisor:</strong> {config.nombre_emisor}</span>
            <span><strong>CUIT:</strong> {config.cuit}</span>
            <span><strong>Monotributista Cat. {config.categoria_monotributo}</strong></span>
            <span><strong>Punto de Venta:</strong> {config.punto_venta}</span>
            <span className="text-primary font-semibold">FACTURA C</span>
          </div>
        </CardContent>
      </Card>

      {/* Datos del comprobante */}
      <Card>
        <CardHeader><CardTitle className="text-base">Datos del Comprobante</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Fecha de emisión</Label>
            <Input type="date" value={form.fecha_emision} onChange={e => setForm(p => ({ ...p, fecha_emision: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Concepto</Label>
            <Select value={form.concepto} onValueChange={v => setForm(p => ({ ...p, concepto: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="productos">Productos</SelectItem>
                <SelectItem value="servicios">Servicios</SelectItem>
                <SelectItem value="productos_y_servicios">Productos y Servicios</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Forma de pago</Label>
            <Select value={form.forma_pago} onValueChange={v => setForm(p => ({ ...p, forma_pago: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Datos del cliente */}
      <Card>
        <CardHeader><CardTitle className="text-base">Datos del Cliente</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Nombre / Razón social *</Label>
            <Input 
              value={form.cliente_nombre} 
              onChange={e => setForm(p => ({ ...p, cliente_nombre: e.target.value }))} 
              placeholder="Nombre completo" 
            />
            {form.cliente_condicion_iva === "consumidor_final" && !form.cliente_nombre && (
              <p className="text-xs text-amber-700">Para consumidor final, podés dejar vacío o usar "Consumidor Final"</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>DNI / CUIT</Label>
            <Input 
              value={form.cliente_cuit_dni} 
              onChange={e => setForm(p => ({ ...p, cliente_cuit_dni: e.target.value }))} 
              placeholder="Sin guiones" 
            />
            {form.cliente_condicion_iva === "consumidor_final" && !form.cliente_cuit_dni && (
              <p className="text-xs text-amber-700">Opcional para consumidor final</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Condición IVA</Label>
            <Select value={form.cliente_condicion_iva} onValueChange={v => setForm(p => ({ ...p, cliente_condicion_iva: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="consumidor_final">Consumidor Final</SelectItem>
                <SelectItem value="monotributista">Monotributista</SelectItem>
                <SelectItem value="responsable_inscripto">Responsable Inscripto</SelectItem>
                <SelectItem value="exento">Exento</SelectItem>
                <SelectItem value="no_responsable">No Responsable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Domicilio</Label>
            <Input 
              value={form.cliente_domicilio} 
              onChange={e => setForm(p => ({ ...p, cliente_domicilio: e.target.value }))} 
              placeholder="Opcional" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Detalle items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Detalle de Servicios / Productos</CardTitle>
          <Button size="sm" variant="outline" onClick={addItem} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Agregar ítem
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Encabezados */}
          <div className="hidden md:grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
            <span className="col-span-6">Descripción</span>
            <span className="col-span-2 text-center">Cant.</span>
            <span className="col-span-2 text-right">P. Unitario</span>
            <span className="col-span-2 text-right">Subtotal</span>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 md:col-span-6">
                <Input
                  value={item.descripcion}
                  onChange={e => updateItem(idx, "descripcion", e.target.value)}
                  placeholder="Descripción del servicio/producto"
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <Input
                  type="number"
                  min="1"
                  value={item.cantidad}
                  onChange={e => updateItem(idx, "cantidad", e.target.value)}
                  placeholder="Cant."
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <Input
                  type="number"
                  min="0"
                  value={item.precio_unitario}
                  onChange={e => updateItem(idx, "precio_unitario", e.target.value)}
                  placeholder="Precio"
                />
              </div>
              <div className="col-span-3 md:col-span-2 text-right font-medium text-sm pr-1">
                ${Number(item.subtotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </div>
              <div className="col-span-1 flex justify-end">
                {items.length > 1 && (
                  <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => removeItem(idx)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <div className="border-t pt-3 flex flex-col items-end gap-1">
            <div className="flex gap-4 text-lg font-bold">
              <span>TOTAL:</span>
              <span className="text-primary">${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-xs text-muted-foreground">IVA no aplica — Monotributista</p>
          </div>
        </CardContent>
      </Card>

      {/* CAE (opcional) */}
      <Card>
        <CardHeader><CardTitle className="text-base">CAE — AFIP (opcional)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Número de CAE</Label>
            <Input value={form.cae} onChange={e => setForm(p => ({ ...p, cae: e.target.value }))} placeholder="Código de autorización AFIP" />
          </div>
          <div className="space-y-1">
            <Label>Vencimiento CAE</Label>
            <Input type="date" value={form.cae_vencimiento} onChange={e => setForm(p => ({ ...p, cae_vencimiento: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <div className="space-y-1">
        <Label>Observaciones</Label>
        <Textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} placeholder="Observaciones opcionales..." rows={2} />
      </div>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleEmitir} disabled={loading} className="gap-2">
          <FileCheck className="w-5 h-5" />
          {loading ? "Emitiendo..." : "Emitir Factura C"}
        </Button>
      </div>
    </div>
  );
}