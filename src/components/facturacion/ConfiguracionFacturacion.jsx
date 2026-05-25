import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, CheckCircle2, ExternalLink, ShieldCheck, ChevronRight, Info } from "lucide-react";

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

  const pasos = [
    {
      num: 1,
      titulo: "Ingresar a ARCA (ex AFIP)",
      desc: "Accedé con CUIT y Clave Fiscal (nivel 3 o superior) al portal de ARCA.",
      link: "https://auth.afip.gob.ar/contribuyente_/login.xhtml",
      linkLabel: "Ingresar a ARCA",
    },
    {
      num: 2,
      titulo: "Ir a \"Administración de Certificados Digitales\"",
      desc: "Dentro del perfil de tu CUIT, buscá el servicio \"Administración de Certificados Digitales\" en la lista de servicios habilitados.",
      link: "https://serviciosweb.afip.gob.ar/CertificadosDigitales/",
      linkLabel: "Certificados Digitales ARCA",
    },
    {
      num: 3,
      titulo: "Generar un nuevo certificado",
      desc: "Hacé clic en \"Agregar Alias\" o \"Nuevo certificado\". Ingresá un alias (ej: factura_electronica), seleccioná el servicio wsfe (Factura Electrónica) y descargá el archivo .crt generado.",
      link: null,
    },
    {
      num: 4,
      titulo: "Habilitar el servicio WSFE",
      desc: "En ARCA, ir a \"Administrar relaciones\" → agregar el servicio \"Factura Electrónica (WSFE)\" para tu CUIT. Esto autoriza a emitir facturas electrónicas.",
      link: "https://auth.afip.gob.ar/contribuyente_/login.xhtml",
      linkLabel: "Administrar relaciones en ARCA",
    },
    {
      num: 5,
      titulo: "Habilitar Punto de Venta",
      desc: "En ARCA → \"Comprobantes en línea\" → \"Datos adicionales\" → dar de alta un Punto de Venta con tipo \"Web Services\" (no manual). Anotá el número (ej: 0001).",
      link: "https://serviciosweb.afip.gob.ar/facturaweb/loginPage.aspx",
      linkLabel: "Comprobantes en línea ARCA",
    },
    {
      num: 6,
      titulo: "Guardar tu CUIT y Punto de Venta",
      desc: "Una vez habilitado, completá los datos en la sección de configuración de abajo y guardá.",
      link: null,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Guía AFIP/ARCA */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-blue-800">
            <ShieldCheck className="w-5 h-5" />
            Guía: Certificados y habilitación en ARCA (ex AFIP)
          </CardTitle>
          <p className="text-xs text-blue-700 mt-1">
            Para emitir facturas electrónicas Tipo C como monotributista necesitás seguir estos pasos en el portal de ARCA.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {pasos.map((paso) => (
            <div key={paso.num} className="flex gap-3 p-3 rounded-lg bg-white border border-blue-100">
              <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {paso.num}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{paso.titulo}</p>
                <p className="text-xs text-gray-600 mt-0.5">{paso.desc}</p>
                {paso.link && (
                  <a
                    href={paso.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1.5 underline underline-offset-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {paso.linkLabel}
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* Links útiles */}
          <div className="mt-4 pt-3 border-t border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Links útiles ARCA / AFIP</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Portal ARCA", url: "https://www.afip.gob.ar/landing/default.asp" },
                { label: "Monotributo ARCA", url: "https://monotributo.afip.gob.ar/" },
                { label: "Factura en línea", url: "https://serviciosweb.afip.gob.ar/facturaweb/loginPage.aspx" },
                { label: "Clave fiscal nivel 3", url: "https://www.afip.gob.ar/claveFiscal/" },
                { label: "Ayuda certificados digitales", url: "https://serviciosweb.afip.gob.ar/CertificadosDigitales/ayuda.aspx" },
              ].map(({ label, url }) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-blue-200 text-xs text-blue-700 hover:bg-blue-100 transition-colors font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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