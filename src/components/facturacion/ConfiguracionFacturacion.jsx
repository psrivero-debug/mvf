import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, CheckCircle2 } from "lucide-react";

const CATEGORIAS = ["A","B","C","D","E","F","G","H","I","J","K"];

export default function ConfiguracionFacturacion({ config, onSave }) {
  const [form, setForm] = useState({
    nombre_emisor: "",
    cuit: "",
    categoria_monotributo: "A",
    domicilio_fiscal: "",
    localidad: "",
    provincia: "San Luis",
    actividad: "Servicios jurídicos",
    inicio_actividades: "",
    punto_venta: "0001",
    ultimo_numero: 0,
    email_emisor: "",
    telefono_emisor: "",
  });
  const [guardado, setGuardado] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config) setForm({ ...form, ...config });
  }, [config]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setLoading(true);
    if (config?.id) {
      await base44.entities.ConfigFacturacion.update(config.id, form);
    } else {
      await base44.entities.ConfigFacturacion.create(form);
    }
    setLoading(false);
    setGuardado(true);
    onSave();
    setTimeout(() => setGuardado(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del Emisor (Monotributista)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Nombre completo / Razón social *</Label>
            <Input value={form.nombre_emisor} onChange={e => handleChange("nombre_emisor", e.target.value)} placeholder="Ej: María López" />
          </div>
          <div className="space-y-1">
            <Label>CUIT *</Label>
            <Input value={form.cuit} onChange={e => handleChange("cuit", e.target.value)} placeholder="20-12345678-9" />
          </div>
          <div className="space-y-1">
            <Label>Categoría Monotributo</Label>
            <Select value={form.categoria_monotributo} onValueChange={v => handleChange("categoria_monotributo", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map(c => <SelectItem key={c} value={c}>Categoría {c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Actividad principal</Label>
            <Input value={form.actividad} onChange={e => handleChange("actividad", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Domicilio fiscal</Label>
            <Input value={form.domicilio_fiscal} onChange={e => handleChange("domicilio_fiscal", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Localidad</Label>
            <Input value={form.localidad} onChange={e => handleChange("localidad", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Provincia</Label>
            <Input value={form.provincia} onChange={e => handleChange("provincia", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Inicio de actividades</Label>
            <Input type="date" value={form.inicio_actividades} onChange={e => handleChange("inicio_actividades", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Email de contacto</Label>
            <Input type="email" value={form.email_emisor} onChange={e => handleChange("email_emisor", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Teléfono</Label>
            <Input value={form.telefono_emisor} onChange={e => handleChange("telefono_emisor", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de Facturación</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Punto de Venta (AFIP)</Label>
            <Input value={form.punto_venta} onChange={e => handleChange("punto_venta", e.target.value)} placeholder="0001" maxLength={4} />
          </div>
          <div className="space-y-1">
            <Label>Último número emitido</Label>
            <Input type="number" value={form.ultimo_numero} onChange={e => handleChange("ultimo_numero", parseInt(e.target.value) || 0)} />
            <p className="text-xs text-muted-foreground">La próxima factura será la N° {(parseInt(form.ultimo_numero) || 0) + 1}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          {guardado ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {guardado ? "Configuración guardada" : "Guardar configuración"}
        </Button>
      </div>
    </div>
  );
}