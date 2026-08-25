import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Printer, Trash2, FileText, User, Calendar, X, ChevronRight, UserPlus, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

const formatPesos = (n) =>
  (n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

// Requisitos por categoría de arancel
const REQUISITOS_POR_CATEGORIA = {
  consulta: ["DNI o documento de identidad", "Documentación relacionada al caso"],
  asesoria: ["DNI o documento de identidad", "Documentación relacionada al caso", "Comprobantes o contratos relevantes"],
  defensa: [
    "DNI o documento de identidad del cliente",
    "Copia de la denuncia o demanda recibida",
    "Toda la documentación relacionada al caso",
    "Antecedentes del proceso judicial si existieren",
    "Comprobantes de domicilio",
  ],
  redaccion: [
    "DNI o documento de identidad",
    "Datos completos de las partes involucradas",
    "Información detallada del acto a instrumentar",
    "Documentación base (contratos previos, escrituras, etc.)",
  ],
  mediacion: [
    "DNI o documento de identidad",
    "Documentación del conflicto",
    "Datos de la contraparte",
    "Comprobantes de intentos previos de acuerdo (si existieren)",
  ],
  otro: ["DNI o documento de identidad", "Documentación relevante al trámite"],
};

function buildPresupuestoHTML(pres, tarifasSeleccionadas, valorBase, config, customConcepto = null, adelanto = 0) {
  const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const vencimiento = format(addDays(new Date(), 15), "d 'de' MMMM yyyy", { locale: es });

  const montoBase = pres.monto_base || 0;
  const adelantoNum = Number(adelanto) || 0;
  const saldo = Math.max(montoBase - adelantoNum, 0);
  const efectivo10 = Math.round(saldo * 0.90);
  const efectivoContado = saldo; // 1 pago sin descuento extra
  const cuota6 = Math.round(saldo / 6);

  // Categorías de los aranceles seleccionados para requisitos
  const categorias = [...new Set(tarifasSeleccionadas.map(t => t.categoria))];
  const requisitos = [...new Set(categorias.flatMap(c => REQUISITOS_POR_CATEGORIA[c] || REQUISITOS_POR_CATEGORIA.otro))];

  const filasArancel = tarifasSeleccionadas.map(t => `
    <tr style="border-bottom:1px solid #e2e8f0">
      <td style="padding:8px 14px">${t.concepto}</td>
      <td style="padding:8px 14px;text-align:center">${t.multiplicador} IUS</td>
      <td style="padding:8px 14px;text-align:right">${formatPesos(valorBase * t.multiplicador)}</td>
    </tr>
  `).join("") + (customConcepto && customConcepto.descripcion ? `
    <tr style="border-bottom:1px solid #e2e8f0">
      <td style="padding:8px 14px">${customConcepto.descripcion}</td>
      <td style="padding:8px 14px;text-align:center">—</td>
      <td style="padding:8px 14px;text-align:right">${formatPesos(Number(customConcepto.monto) || 0)}</td>
    </tr>
  ` : "");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Times New Roman", Times, serif; color: #222; background: #fff; font-size: 12pt; }
    .page { max-width: 820px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 28px; }
    .logo h1 { font-size: 20px; font-weight: bold; color: #1e3a5f; }
    .logo p { font-size: 11px; color: #666; margin-top: 3px; }
    .badge { background: #1e3a5f; color: white; padding: 8px 18px; border-radius: 6px; text-align: center; }
    .badge h2 { font-size: 16px; font-weight: bold; letter-spacing: 2px; }
    .badge p { font-size: 11px; margin-top: 2px; opacity: 0.85; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .meta-item label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #888; letter-spacing: 1px; display: block; margin-bottom: 3px; }
    .meta-item .val { font-size: 13px; color: #222; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 5px; margin-bottom: 12px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #1e3a5f; color: white; }
    th { padding: 9px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .total-row { background: #f0f7ff !important; font-weight: bold; border-top: 2px solid #1e3a5f; }
    .pagos-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .pago-box { border: 2px solid #e2e8f0; border-radius: 8px; padding: 14px 10px; text-align: center; }
    .pago-box.destacado { border-color: #1e3a5f; background: #f0f7ff; }
    .pago-box .ptitle { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #888; letter-spacing: .05em; }
    .pago-box .pamt { font-size: 17px; font-weight: bold; color: #1e3a5f; margin: 6px 0 3px; }
    .pago-box .psub { font-size: 10px; color: #666; }
    .iva-nota { background: #fffbeb; border: 1px solid #fbbf24; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #92400e; margin-bottom: 20px; }
    .validez-nota { background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #0c4a6e; margin-bottom: 20px; }
    .req-list { padding-left: 18px; }
    .req-list li { margin: 5px 0; font-size: 12px; }
    .firma-area { display: flex; justify-content: flex-end; margin-top: 50px; }
    .firma-box { text-align: center; width: 220px; border-top: 1px solid #444; padding-top: 8px; font-size: 11px; color: #555; }
    .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 10px; color: #999; text-align: center; }
    @media print { body { margin: 0; } .page { padding: 20px; max-width: 100%; } }
  </style>
  </head><body>
  <div class="page">
    <!-- HOJA 1: PRESUPUESTO -->
    <div class="header">
      <div class="logo">
        <h1>Pérez &amp; Funes</h1>
        <p>Estudio Jurídico · Negocios Inmobiliarios</p>
        <p style="margin-top:5px;color:#888;font-size:10px">San Luis, Argentina</p>
      </div>
      <div class="badge">
        <h2>PRESUPUESTO</h2>
        <p>Nº ${pres.numero || "—"}</p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><label>Fecha de emisión</label><div class="val">${hoy}</div></div>
      <div class="meta-item"><label>Válido hasta</label><div class="val">${vencimiento} (15 días corridos)</div></div>
      <div class="meta-item"><label>Cliente</label><div class="val" style="font-weight:bold;font-size:15px">${pres.client_name}</div></div>
      ${pres.notas ? `<div class="meta-item"><label>Observaciones</label><div class="val">${pres.notas}</div></div>` : ""}
    </div>

    <div class="iva-nota">
      ⚠️ <strong>Importante:</strong> Todos los montos indicados a continuación son <strong>más IVA (21%)</strong>. El importe final a abonar incluirá el impuesto correspondiente.
    </div>

    <div class="section-title">Detalle de Arancel (Tabla IUS)</div>
    <table>
      <thead><tr><th>Concepto</th><th style="text-align:center">IUS</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody>
        ${filasArancel}
        <tr class="total-row">
          <td style="padding:10px 14px">TOTAL ARANCEL</td>
          <td style="padding:10px 14px;text-align:center">${tarifasSeleccionadas.reduce((s, t) => s + t.multiplicador, 0)} IUS</td>
          <td style="padding:10px 14px;text-align:right">${formatPesos(montoBase)}</td>
        </tr>
      </tbody>
    </table>

    ${adelantoNum > 0 ? `
    <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:10px;font-weight:bold;text-transform:uppercase;color:#047857;letter-spacing:.05em">Adelanto para iniciar trámite</div>
        <div style="font-size:18px;font-weight:bold;color:#065f46;margin-top:3px">${formatPesos(adelantoNum)}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;font-weight:bold;text-transform:uppercase;color:#888;letter-spacing:.05em">Saldo pendiente</div>
        <div style="font-size:18px;font-weight:bold;color:#1e3a5f;margin-top:3px">${formatPesos(saldo)} <span style="font-size:11px;color:#92400e">+ IVA</span></div>
      </div>
    </div>
    ` : ""}

    <div class="section-title">Opciones de Pago${adelantoNum > 0 ? " (sobre saldo)" : ""}</div>
    <div class="pagos-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="pago-box destacado">
        <div class="ptitle">Efectivo (10% dto.)</div>
        <div class="pamt">${formatPesos(efectivo10)}</div>
        <div class="psub">Pago único con descuento</div>
      </div>
      <div class="pago-box">
        <div class="ptitle">Contado 1 pago</div>
        <div class="pamt">${formatPesos(efectivoContado)}</div>
        <div class="psub">Sin recargo</div>
      </div>
      <div class="pago-box">
        <div class="ptitle">6 cuotas fijas</div>
        <div class="pamt">${formatPesos(cuota6)}</div>
        <div class="psub">por mes · sin interés</div>
      </div>
    </div>

    <div class="validez-nota">
      📅 Este presupuesto tiene una validez de <strong>15 días corridos</strong> desde su emisión (${hoy}). Vence el <strong>${vencimiento}</strong>.
      Transcurrido dicho plazo, los valores pueden estar sujetos a actualización por variación del índice IUS.
    </div>

    <div class="firma-area">
      <div class="firma-box">Firma y sello del estudio</div>
    </div>

    <div class="footer">Pérez &amp; Funes — Estudio Jurídico · San Luis · Presupuesto Nº ${pres.numero || "—"}</div>

    <!-- HOJA 2: REQUISITOS -->
    <div style="page-break-before: always; padding-top: 40px;">
      <div class="header">
        <div class="logo">
          <h1>Pérez &amp; Funes</h1>
          <p>Estudio Jurídico · Negocios Inmobiliarios</p>
        </div>
        <div class="badge" style="background:#2d6a4f">
          <h2>REQUISITOS</h2>
          <p>Documentación necesaria</p>
        </div>
      </div>

      <p style="margin-bottom:16px;color:#444">
        A continuación se detalla la documentación requerida para dar inicio al trámite correspondiente al presupuesto <strong>Nº ${pres.numero || "—"}</strong> para el/la Sr./a <strong>${pres.client_name}</strong>.
      </p>

      <div class="section-title">Documentación a Presentar</div>
      <ul class="req-list">
        ${requisitos.map(r => `<li>${r}</li>`).join("")}
      </ul>

      ${pres.notas ? `<div style="margin-top:20px;padding:12px;background:#f9f9f9;border-left:4px solid #1e3a5f;border-radius:0 6px 6px 0"><strong>Observaciones del estudio:</strong><p style="margin-top:5px;color:#444">${pres.notas}</p></div>` : ""}

      <div style="margin-top:30px;padding:14px;background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;font-size:12px;color:#92400e">
        ⚠️ La documentación deberá presentarse en original y una copia. El estudio no se responsabiliza por la demora en el inicio del trámite por falta de documentación. Ante cualquier duda, consulte al profesional a cargo.
      </div>

      <div class="footer" style="margin-top:40px">Pérez &amp; Funes — Estudio Jurídico · San Luis · Los montos son más IVA (21%)</div>
    </div>
  </div>
  </body></html>`;
}

function imprimirPresupuesto(pres, tarifasSeleccionadas, valorBase, config, customConcepto = null, adelanto = 0) {
  const w = window.open("", "_blank");
  w.document.write(buildPresupuestoHTML(pres, tarifasSeleccionadas, valorBase, config, customConcepto, adelanto));
  w.document.close();
  w.print();
}

async function generarArchivoPresupuesto(pres, tarifasSeleccionadas, valorBase, config, customConcepto, adelanto, formato) {
  const html = buildPresupuestoHTML(pres, tarifasSeleccionadas, valorBase, config, customConcepto, adelanto);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "820px";
  iframe.style.height = "1200px";
  iframe.style.border = "0";
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
  await new Promise((res) => { iframe.onload = res; });
  await new Promise((r) => setTimeout(r, 250));
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  const canvas = await html2canvas(doc.body, { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: 820, windowWidth: 820 });
  document.body.removeChild(iframe);
  const fileName = `presupuesto-${(pres.numero || pres.client_name || "documento").replace(/\s+/g, "-")}`;
  if (formato === "pdf") {
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= 297;
    while (heightLeft > 0) {
      position -= 297;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }
    pdf.save(`${fileName}.pdf`);
  } else {
    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }
}

export default function Presupuestos() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [tarifaSearch, setTarifaSearch] = useState("");
  const [selectedTarifas, setSelectedTarifas] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDrop, setShowClientDrop] = useState(false);
  const [form, setForm] = useState({
    numero: "", client_id: "", client_name: "", notas: "",
  });
  const [busquedaPresupuesto, setBusquedaPresupuesto] = useState("");
  const [conceptoExtra, setConceptoExtra] = useState({ descripcion: "", monto: "" });
  const [adelanto, setAdelanto] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ nombre: "", apellido: "", dni_cuit: "", phone: "", email: "" });
  const [wspDialog, setWspDialog] = useState({ open: false, pres: null, tarifas: [], conceptoExtra: null, adelanto: 0 });
  const [wspPhone, setWspPhone] = useState("");
  const [wspLoading, setWspLoading] = useState(null);
  const queryClient = useQueryClient();

  const { data: presupuestos = [], isLoading } = useQuery({
    queryKey: ["presupuestos"],
    queryFn: () => base44.entities.Presupuesto.list("-created_date"),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("full_name"),
  });

  const { data: tarifas = [] } = useQuery({
    queryKey: ["iustarifas"],
    queryFn: () => base44.entities.IusTarifa.filter({ activo: true }, "concepto"),
  });

  const { data: configs = [] } = useQuery({
    queryKey: ["iusconfig"],
    queryFn: () => base44.entities.IusConfig.list("-created_date", 1),
  });

  const valorBase = configs[0]?.valor_base || 0;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Presupuesto.create(data),
    onSuccess: (pres) => {
      queryClient.invalidateQueries({ queryKey: ["presupuestos"] });
      imprimirPresupuesto(pres, selectedTarifas, valorBase, configs[0], conceptoExtra.descripcion ? conceptoExtra : null, adelanto);
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Presupuesto.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["presupuestos"] }),
  });

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: (cli) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      const fullName = cli.full_name || `${cli.nombre || ""} ${cli.apellido || ""}`.trim();
      setClientSearch(fullName);
      setForm(f => ({ ...f, client_id: cli.id, client_name: fullName }));
      setShowNewClient(false);
      setNewClient({ nombre: "", apellido: "", dni_cuit: "", phone: "", email: "" });
    },
  });

  const resetForm = () => {
    setForm({ numero: "", client_id: "", client_name: "", notas: "" });
    setClientSearch("");
    setSelectedTarifas([]);
    setTarifaSearch("");
    setConceptoExtra({ descripcion: "", monto: "" });
    setAdelanto("");
  };

  const montoBase = selectedTarifas.reduce((s, t) => s + (t.multiplicador * valorBase), 0) + (Number(conceptoExtra.monto) || 0);
  const adelantoNum = Number(adelanto) || 0;
  const saldo = Math.max(montoBase - adelantoNum, 0);
  const efectivo10 = Math.round(saldo * 0.90);
  const cuota6 = Math.round(saldo / 6);

  const toggleTarifa = (t) => {
    setSelectedTarifas(prev =>
      prev.find(x => x.id === t.id) ? prev.filter(x => x.id !== t.id) : [...prev, t]
    );
  };

  const filteredClients = clients.filter(c =>
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const tarifasFiltradas = tarifas.filter(t =>
    t.concepto?.toLowerCase().includes(tarifaSearch.toLowerCase())
  );

  const filteredPresupuestos = presupuestos.filter(p =>
    p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.numero?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    const data = {
      ...form,
      client_name: clientSearch || form.client_name,
      monto_base: montoBase,
      conceptos_ids: selectedTarifas.map(t => t.id),
      conceptos_nombres: [...selectedTarifas.map(t => t.concepto), ...(conceptoExtra.descripcion ? [conceptoExtra.descripcion] : [])].join(", "),
      concepto_extra_descripcion: conceptoExtra.descripcion || "",
      concepto_extra_monto: Number(conceptoExtra.monto) || 0,
      adelanto: adelantoNum,
      fecha_emision: new Date().toISOString().split("T")[0],
      fecha_vencimiento: format(addDays(new Date(), 15), "yyyy-MM-dd"),
      monto_efectivo_desc: efectivo10,
      monto_contado: saldo,
      cuotas_6: cuota6,
    };
    createMutation.mutate(data);
  };

  // Retomar presupuesto existente para reimprimir
  const retomar = (p) => {
    const presupTarifas = tarifas.filter(t => (p.conceptos_ids || []).includes(t.id));
    const conceptoExtraSaved = p.concepto_extra_descripcion ? { descripcion: p.concepto_extra_descripcion, monto: p.concepto_extra_monto } : null;
    imprimirPresupuesto(p, presupTarifas.length > 0 ? presupTarifas : tarifas.filter(t => p.conceptos_nombres?.includes(t.concepto)), valorBase, configs[0], conceptoExtraSaved, p.adelanto || 0);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold">Presupuestos</h1>
          <p className="text-muted-foreground mt-1">Generación de presupuestos con arancel IUS, opciones de pago y requisitos</p>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Presupuesto
        </Button>
      </div>

      {/* Formulario nuevo presupuesto */}
      {showForm && (
        <Card className="border-2 border-primary/30 shadow-md">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">Nuevo Presupuesto</h2>
              <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nº de Presupuesto</Label>
                <Input placeholder="Ej: 2026-001" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Cliente *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Escribir o buscar cliente..."
                    value={clientSearch}
                    onChange={e => { setClientSearch(e.target.value); setForm({ ...form, client_name: e.target.value, client_id: "" }); setShowClientDrop(true); }}
                    onFocus={() => setShowClientDrop(true)}
                    onBlur={() => setTimeout(() => setShowClientDrop(false), 150)}
                    className="pl-9"
                  />
                  {showClientDrop && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {filteredClients.map(c => (
                        <button key={c.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                          onMouseDown={() => { setClientSearch(c.full_name); setForm({ ...form, client_id: c.id, client_name: c.full_name }); setShowClientDrop(false); }}>
                          {c.full_name}
                        </button>
                      ))}
                      <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-accent border-t flex items-center gap-2 text-primary font-medium"
                        onMouseDown={() => { setShowClientDrop(false); setShowNewClient(true); }}>
                        <UserPlus className="w-4 h-4" /> Agregar nuevo cliente
                      </button>
                    </div>
                  )}
                </div>
                {form.client_id && <p className="text-xs text-green-600">✓ Cliente existente vinculado</p>}
              </div>
            </div>

            {/* Selector de aranceles */}
            <div className="grid gap-2">
              <Label>Conceptos de Arancel (Tabla IUS)</Label>
              <Input placeholder="Buscar concepto..." value={tarifaSearch} onChange={e => setTarifaSearch(e.target.value)} />
              <div className="border rounded-lg max-h-52 overflow-y-auto divide-y">
                {tarifasFiltradas.length === 0 && (
                  <p className="text-xs text-muted-foreground p-3">No hay aranceles configurados. Configuralos en Tabla IUS.</p>
                )}
                {tarifasFiltradas.map(t => {
                  const selected = selectedTarifas.find(x => x.id === t.id);
                  return (
                    <div key={t.id}
                      onClick={() => toggleTarifa(t)}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${selected ? "bg-primary/10" : "hover:bg-muted/50"}`}
                    >
                      <input type="checkbox" readOnly checked={!!selected} className="rounded shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.concepto}</p>
                        {t.descripcion && <p className="text-xs text-muted-foreground truncate">{t.descripcion}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-primary">{t.multiplicador} IUS</p>
                        {valorBase > 0 && <p className="text-xs text-muted-foreground">{formatPesos(t.multiplicador * valorBase)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedTarifas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTarifas.map(t => (
                    <Badge key={t.id} variant="secondary" className="gap-1 pr-1">
                      {t.concepto}
                      <button onClick={() => toggleTarifa(t)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Concepto adicional único (fuera de tabla IUS) */}
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Concepto adicional (fuera de tabla IUS, opcional)</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input placeholder="Descripción del concepto" value={conceptoExtra.descripcion}
                    onChange={e => setConceptoExtra({ ...conceptoExtra, descripcion: e.target.value })}
                    className="flex-1" />
                  <Input placeholder="Monto ($)" type="number" value={conceptoExtra.monto}
                    onChange={e => setConceptoExtra({ ...conceptoExtra, monto: e.target.value })}
                    className="sm:w-32" />
                  {conceptoExtra.descripcion || conceptoExtra.monto ? (
                    <Button type="button" variant="ghost" size="sm"
                      onClick={() => setConceptoExtra({ descripcion: "", monto: "" })}
                      className="gap-1.5 shrink-0 text-destructive">
                      <X className="w-4 h-4" /> Limpiar
                    </Button>
                  ) : null}
                </div>
                {conceptoExtra.descripcion && conceptoExtra.monto > 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 inline-block">
                    {conceptoExtra.descripcion} · {formatPesos(conceptoExtra.monto)}
                  </p>
                )}
              </div>

              {/* Adelanto */}
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Adelanto para iniciar trámite (opcional)</p>
                <Input placeholder="Monto del adelanto ($)" type="number" value={adelanto}
                  onChange={e => setAdelanto(e.target.value)}
                  className="sm:w-48" />
                {adelantoNum > 0 && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 inline-block">
                    Adelanto: {formatPesos(adelantoNum)} · Saldo: {formatPesos(saldo)} + IVA
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Observaciones (opcional)</Label>
              <Textarea placeholder="Notas adicionales para el presupuesto..." value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} />
            </div>

            {/* Preview de montos */}
            {montoBase > 0 && (
              <div className="rounded-xl bg-muted/40 border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vista previa de opciones de pago <span className="text-amber-600">(+ IVA 21%)</span></p>
                {adelantoNum > 0 && (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
                    <span className="text-xs font-medium text-emerald-800">Adelanto para iniciar trámite</span>
                    <span className="text-sm font-bold text-emerald-700">{formatPesos(adelantoNum)}</span>
                    <span className="text-xs font-medium text-emerald-800">Saldo pendiente</span>
                    <span className="text-sm font-bold text-primary">{formatPesos(saldo)} <span className="text-amber-600">+ IVA</span></span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-primary/5 border-2 border-primary rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground font-medium">Efectivo (10% dto.)</p>
                    <p className="text-lg font-bold text-primary mt-1">{formatPesos(efectivo10)}</p>
                    <p className="text-xs text-muted-foreground">1 pago</p>
                  </div>
                  <div className="bg-background border rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground font-medium">Contado 1 pago</p>
                    <p className="text-lg font-bold mt-1">{formatPesos(saldo)}</p>
                    <p className="text-xs text-muted-foreground">sin recargo</p>
                  </div>
                  <div className="bg-background border rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground font-medium">6 cuotas fijas</p>
                    <p className="text-lg font-bold mt-1">{formatPesos(cuota6)}</p>
                    <p className="text-xs text-muted-foreground">por mes</p>
                  </div>
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠️ Los montos indicados son <strong>más IVA (21%)</strong>. Validez: <strong>15 días corridos</strong>.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
              <Button
                onClick={handleSubmit}
                disabled={!clientSearch || createMutation.isPending}
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                {createMutation.isPending ? "Guardando..." : "Guardar e Imprimir"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Búsqueda y listado */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente o nº de presupuesto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        {filteredPresupuestos.length > 0 && (
          <span className="text-sm text-muted-foreground">{filteredPresupuestos.length} presupuesto{filteredPresupuestos.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredPresupuestos.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-14 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No hay presupuestos registrados</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Creá el primero con el botón de arriba</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPresupuestos.map(p => (
            <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {p.numero && <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">#{p.numero}</span>}
                        <span className="font-semibold">{p.client_name}</span>
                      </div>
                      {p.conceptos_nombres && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{p.conceptos_nombres}</p>}
                      <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-muted-foreground">
                        {p.fecha_emision && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(p.fecha_emision + "T12:00:00"), "d MMM yyyy", { locale: es })}
                          </span>
                        )}
                        {p.fecha_vencimiento && (
                          <span className="flex items-center gap-1 text-amber-600">
                            Vence: {format(new Date(p.fecha_vencimiento + "T12:00:00"), "d MMM yyyy", { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.monto_base > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Arancel</p>
                        <p className="font-bold text-primary">{formatPesos(p.monto_base)}</p>
                        <p className="text-xs text-muted-foreground">+ IVA</p>
                      </div>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => retomar(p)}>
                        <Printer className="w-3.5 h-3.5" /> Reimprimir
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs text-emerald-700" onClick={() => {
                        const presupTarifas = tarifas.filter(t => (p.conceptos_ids || []).includes(t.id));
                        const ce = p.concepto_extra_descripcion ? { descripcion: p.concepto_extra_descripcion, monto: p.concepto_extra_monto } : null;
                        const client = clients.find(c => c.id === p.client_id);
                        setWspPhone(client?.phone || "");
                        setWspDialog({
                          open: true, pres: p,
                          tarifas: presupTarifas.length > 0 ? presupTarifas : tarifas.filter(t => p.conceptos_nombres?.includes(t.concepto)),
                          conceptoExtra: ce, adelanto: p.adelanto || 0,
                        });
                      }}>
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
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

      {/* Dialog nuevo cliente */}
      <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Nombre *</Label>
              <Input value={newClient.nombre} onChange={e => setNewClient({ ...newClient, nombre: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Apellido *</Label>
              <Input value={newClient.apellido} onChange={e => setNewClient({ ...newClient, apellido: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>DNI / CUIT</Label>
              <Input value={newClient.dni_cuit} onChange={e => setNewClient({ ...newClient, dni_cuit: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Teléfono *</Label>
              <Input value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
            </div>
            <div className="grid gap-1.5 col-span-2">
              <Label>Email</Label>
              <Input type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClient(false)}>Cancelar</Button>
            <Button
              disabled={!newClient.nombre.trim() || !newClient.apellido.trim() || !newClient.phone.trim() || createClientMutation.isPending}
              onClick={() => {
                const fullName = `${newClient.nombre.trim()} ${newClient.apellido.trim()}`;
                createClientMutation.mutate({
                  client_type: "persona_fisica",
                  nombre: newClient.nombre.trim(),
                  apellido: newClient.apellido.trim(),
                  full_name: fullName,
                  dni_cuit: newClient.dni_cuit,
                  phone: newClient.phone,
                  email: newClient.email,
                  status: "activo",
                });
              }}
              className="gap-2"
            >
              {createClientMutation.isPending ? "Guardando..." : "Agregar y vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog enviar por WhatsApp */}
      <Dialog open={wspDialog.open} onOpenChange={(o) => setWspDialog((d) => ({ ...d, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-emerald-600" /> Enviar por WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 space-y-1">
              <p className="font-medium">¿Cómo funciona?</p>
              <ol className="list-decimal list-inside space-y-0.5 text-amber-800">
                <li>Tocá <b>Descargar Imagen</b> o <b>Descargar PDF</b> para generar el archivo en tu equipo.</li>
                <li>Tocá <b>Abrir WhatsApp</b> (se abre el chat con un mensaje predefinido).</li>
                <li>Dentro de WhatsApp, adjuntá el archivo descargado con el ícono del clip antes de enviar.</li>
              </ol>
            </div>
            <div className="grid gap-1.5">
              <Label>Teléfono del cliente</Label>
              <Input placeholder="Ej: 5492664123456 (sin + ni espacios)" value={wspPhone} onChange={(e) => setWspPhone(e.target.value)} />
              <p className="text-xs text-muted-foreground">Se abre WhatsApp con un mensaje predefinido; el archivo descargado se adjunta manualmente.</p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="gap-2" disabled={wspLoading} onClick={async () => {
              setWspLoading("imagen");
              try { await generarArchivoPresupuesto(wspDialog.pres, wspDialog.tarifas, valorBase, configs[0], wspDialog.conceptoExtra, wspDialog.adelanto, "imagen"); }
              finally { setWspLoading(null); }
            }}>
              {wspLoading === "imagen" ? "Generando..." : "Descargar Imagen"}
            </Button>
            <Button variant="outline" className="gap-2" disabled={wspLoading} onClick={async () => {
              setWspLoading("pdf");
              try { await generarArchivoPresupuesto(wspDialog.pres, wspDialog.tarifas, valorBase, configs[0], wspDialog.conceptoExtra, wspDialog.adelanto, "pdf"); }
              finally { setWspLoading(null); }
            }}>
              {wspLoading === "pdf" ? "Generando..." : "Descargar PDF"}
            </Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={!wspPhone.trim()} onClick={() => {
              const msg = encodeURIComponent(`Hola ${wspDialog.pres?.client_name || ""}, te envío el presupuesto Nº ${wspDialog.pres?.numero || "—"} de Pérez & Funes. Adjunto el documento.`);
              window.open(`https://wa.me/${wspPhone.replace(/\D/g, "")}?text=${msg}`, "_blank");
            }}>
              <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}