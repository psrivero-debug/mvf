import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Briefcase, CreditCard,
  Building2, AlertCircle, FileText, Pencil, Check, X,
  Receipt, FilePlus, FolderOpen, Users, BookMarked,
  Calendar, Plus, Upload, Loader2, Eye, Trash2, ImageIcon,
  ExternalLink, Download, Printer, Save
} from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

// ── Labels & helpers ──────────────────────────────────────────────
const estadoCivilLabels = { soltero:"Soltero/a", casado:"Casado/a", divorciado:"Divorciado/a", viudo:"Viudo/a", union_convivencial:"Unión Convivencial", separado:"Separado/a" };
const condicionIvaLabels = { responsable_inscripto:"Responsable Inscripto", monotributista:"Monotributista", exento:"Exento", consumidor_final:"Consumidor Final", no_responsable:"No Responsable" };
const tipoCasoLabels = { civil:"Civil", penal:"Penal", laboral:"Laboral", familia:"Familia", comercial:"Comercial", administrativo:"Administrativo", inmobiliario:"Inmobiliario", otro:"Otro" };
const estadoCasoColors = { activo:"bg-green-100 text-green-700", en_analisis:"bg-yellow-100 text-yellow-700", archivado:"bg-gray-100 text-gray-500" };
const formaPagoLabels = { efectivo:"Efectivo", transferencia:"Transferencia", cheque:"Cheque", otro:"Otro" };
const tipoDocLabels = { dni:"DNI", acta_nacimiento:"Acta Nacimiento", acta_matrimonio:"Acta Matrimonio", acta_defuncion:"Acta Defunción", escritura:"Escritura", poder_notarial:"Poder Notarial", sentencia:"Sentencia", contrato:"Contrato", recibo:"Recibo", certificado:"Certificado", foto:"Fotografía", otro:"Otro" };
const tipoDocColors = { dni:"bg-blue-100 text-blue-700", acta_nacimiento:"bg-green-100 text-green-700", acta_matrimonio:"bg-pink-100 text-pink-700", escritura:"bg-amber-100 text-amber-700", poder_notarial:"bg-purple-100 text-purple-700", sentencia:"bg-red-100 text-red-700", contrato:"bg-indigo-100 text-indigo-700", recibo:"bg-emerald-100 text-emerald-700", foto:"bg-orange-100 text-orange-700", otro:"bg-muted text-muted-foreground" };
const formatPesos = (n) => (n || 0).toLocaleString("es-AR", { style:"currency", currency:"ARS", maximumFractionDigits:0 });

const emptyClient = { client_type:"persona_fisica", numero_legajo:"", nombre:"", apellido:"", dni_cuit:"", tipo_dni:"DNI", estado_civil:"", razon_social:"", condicion_iva:"", representante_legal:"", dni_representante:"", full_name:"", email:"", phone:"", address:"", localidad:"", ocupacion:"", datos_a_tener_en_cuenta:"", notes:"", status:"activo" };

// ── Subcomponente: Fila de info ───────────────────────────────────
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

// ── Acta Poder helper ─────────────────────────────────────────────
function buildActaTexto(client, caratula, expediente, juzgado) {
  const hoy = new Date();
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const nombreCliente = client.client_type === "persona_juridica"
    ? (client.razon_social || client.full_name || "").toUpperCase()
    : `${client.nombre || ""} ${client.apellido || ""}`.trim().toUpperCase();
  const dniCliente = client.dni_cuit || "___________";
  const tipoDniCliente = client.client_type === "persona_juridica" ? "CUIT" : (client.tipo_dni || "DNI");
  const domicilioCliente = [client.address, client.localidad].filter(Boolean).join(", ") || "___________";
  const expteStr = expediente ? ` EXPTE. ${expediente}` : "";
  return {
    nombreCliente, dniCliente, tipoDniCliente, domicilioCliente,
    p1: `En la Ciudad de San Luis, capital de la provincia del mismo nombre, República Argentina, a los ${hoy.getDate()} días del mes de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}, comparece ante ${juzgado || "los Juzgados de Familia, Niñez y Adolescencia"}, la señora/el señor ${nombreCliente}, argentina/o, mayor de edad, habiendo acreditado su identidad con el ${tipoDniCliente} N° ${dniCliente}, con domicilio en calle ${domicilioCliente}.`,
    p2: `EXPUSO: Que da y confiere PODER APUD ACTA a favor de la Dra. Silvia Raquel Pérez Arce, Abogada, Matrícula Profesional 2571 del CAPSL y a la Dra. María Valeria Funes Mat. 3081 CAPSL, correo electrónico silviaperezarce@giajsanluis.gov.ar, domicilio legal constituido en 25 de Mayo 477 Ciudad, para que en su nombre y representación intervenga en los autos caratulados "${caratula || "___________________________________"}"${expteStr}, expediente radicado en ${juzgado || "Juzgado de Familia N° ___"}.`,
    p3: `Al efecto faculta para que las represente ante las autoridades que correspondan, con escritos, documentos, pudiendo entablar y contestar demandas, contrademandas, reconvenir, apelar, interponer todos los recursos y desistir, decir de nulidad, prestar y exigir juramentos, declinar y prorrogar jurisdicciones, oponer o absolver posiciones, oponer o renunciar a prescripciones, oponer y contestar excepciones, comprometer en árbitros o arbitradores, reconocer o impugnar obligaciones, solicitar embargos preventivos definitivos y sus cancelaciones, inhibiciones y sus levantamientos, solicitar reconocimiento de firmas, sus cotejos y designar toda clase de peritos, asistir a las audiencias y comparendos, con la facultad de hacer preguntas y presentar interrogatorios, solicitar diligencias e inscribir oficios, mandamientos y exhortos y todo cuanto otra facultad le fuere necesaria para el cumplimiento del presente mandato. Las facultades enunciadas son de mero carácter enumerativo, y en ningún caso limitativas: NO SE AUTORIZA A LA LETRADA COBRO ALGUNO EN REPRESENTACIÓN DEL PODERDANTE.`,
    p4: `Con lo que se dio por terminado el acto, previa lectura y ratificación de su contenido, firma el compareciente. ANTE MÍ QUE DOY FE.-`,
  };
}

function imprimirActaPoder(client, caratula, expediente, juzgado) {
  const t = buildActaTexto(client, caratula, expediente, juzgado);
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Times New Roman",Times,serif;font-size:12pt;color:#000;background:#fff}.page{width:21cm;min-height:29.7cm;margin:0 auto;padding:2.5cm 3cm;line-height:1.8}h1{font-size:14pt;font-weight:bold;text-align:center;letter-spacing:3px;margin-bottom:24pt;text-decoration:underline}p{text-align:justify;margin-bottom:12pt}.firma-area{margin-top:60pt;text-align:center}.firma-box{display:inline-block;text-align:center;width:220pt;border-top:1px solid #000;padding-top:6pt;font-size:10pt}@media print{@page{size:A4;margin:2.5cm 3cm}body{margin:0}.page{padding:0;width:100%}}</style></head><body><div class="page"><h1>ACTA PODER</h1><p>${t.p1}</p><p>${t.p2}</p><p>${t.p3}</p><p>${t.p4}</p><div class="firma-area"><div class="firma-box">Firma del Poderdante</div></div></div></body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

const TABS = [
  { id:"perfil", label:"Perfil", icon:User },
  { id:"casos", label:"Estudio de Caso", icon:BookMarked },
  { id:"presupuestos", label:"Presupuestos", icon:FilePlus },
  { id:"recibos", label:"Recibos", icon:Receipt },
  { id:"legajo", label:"Legajo", icon:FolderOpen },
  { id:"contrapartes", label:"Contrapartes", icon:Users },
];

// ═══════════════════════════════════════════════════════════════════
export default function ClientePerfil({ clientId, onClose }) {
  const [activeTab, setActiveTab] = useState("perfil");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const queryClient = useQueryClient();

  // Modales operativos
  const [showNuevoCaso, setShowNuevoCaso] = useState(false);
  const [showNuevoPresupuesto, setShowNuevoPresupuesto] = useState(false);
  const [showNuevoRecibo, setShowNuevoRecibo] = useState(false);
  const [showSubirLegajo, setShowSubirLegajo] = useState(false);
  const [showActaModal, setShowActaModal] = useState(false);
  const [actaContraparte, setActaContraparte] = useState(null);
  const [actaConfirmada, setActaConfirmada] = useState(false);
  const [actaData, setActaData] = useState({ caratula:"", expediente:"", juzgado:"Juzgado de Familia N° 2" });
  const [previewLegajo, setPreviewLegajo] = useState(null);
  const [reciboFromPresup, setReciboFromPresup] = useState(null); // presupuesto pre-cargado para recibo

  // Forms operativos
  const [casForm, setCasForm] = useState({ titulo:"", tipo_caso:"civil", estado:"activo", jurisdiccion:"", numero_expediente:"", descripcion:"" });
  const [reciboForm, setReciboForm] = useState({ numero:"", fecha:new Date().toISOString().split("T")[0], concepto:"", monto:"", forma_pago:"efectivo", notas:"" });
  const [legajoForm, setLegajoForm] = useState({ titulo:"", tipo_documento:"otro", notas:"", fecha_documento:"", file_url:"" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // ── Queries ────────────────────────────────────────────────────
  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => { const list = await base44.entities.Client.list(); return list.find(c => c.id === clientId) || null; },
    enabled: !!clientId,
  });
  const { data: casos = [] } = useQuery({ queryKey:["estudio-casos", clientId], queryFn: () => base44.entities.EstudioCaso.filter({ client_id:clientId }, "-created_date"), enabled:!!clientId });
  const { data: presupuestos = [] } = useQuery({ queryKey:["presupuestos-cliente", clientId], queryFn: () => base44.entities.Presupuesto.filter({ client_id:clientId }, "-created_date"), enabled:!!clientId });
  const { data: recibos = [] } = useQuery({ queryKey:["recibos-cliente", clientId], queryFn: () => base44.entities.Recibo.filter({ client_id:clientId }, "-created_date"), enabled:!!clientId });
  const { data: legajos = [] } = useQuery({ queryKey:["legajos", clientId], queryFn: () => base44.entities.Legajo.filter({ client_id:clientId }, "-created_date"), enabled:!!clientId });
  const { data: contrapartes = [] } = useQuery({ queryKey:["contrapartes", clientId], queryFn: () => base44.entities.Contraparte.filter({ client_id:clientId }), enabled:!!clientId });

  // ── Mutations ──────────────────────────────────────────────────
  const updateClient = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey:["client", clientId] }); queryClient.invalidateQueries({ queryKey:["clients"] }); setEditing(false); },
  });
  const createCaso = useMutation({
    mutationFn: (data) => base44.entities.EstudioCaso.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey:["estudio-casos", clientId] }); setShowNuevoCaso(false); setCasForm({ titulo:"", tipo_caso:"civil", estado:"activo", jurisdiccion:"", numero_expediente:"", descripcion:"" }); },
  });
  const createRecibo = useMutation({
    mutationFn: (data) => base44.entities.Recibo.create(data),
    onSuccess: (r) => { queryClient.invalidateQueries({ queryKey:["recibos-cliente", clientId] }); setShowNuevoRecibo(false); setReciboFromPresup(null); imprimirRecibo(r); },
  });
  const createLegajo = useMutation({
    mutationFn: (data) => base44.entities.Legajo.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey:["legajos", clientId] }); setShowSubirLegajo(false); setLegajoForm({ titulo:"", tipo_documento:"otro", notas:"", fecha_documento:"", file_url:"" }); },
  });
  const deleteLegajo = useMutation({
    mutationFn: (id) => base44.entities.Legajo.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey:["legajos", clientId] }),
  });

  const startEdit = () => setForm({ ...emptyClient, ...client });
  const handleSave = () => {
    const data = { ...form, full_name: form.client_type === "persona_juridica" ? form.razon_social : `${form.nombre} ${form.apellido}`.trim() };
    updateClient.mutate({ id:client.id, data });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setLegajoForm(prev => ({ ...prev, file_url }));
    setUploading(false);
  };

  // Abrir recibo desde presupuesto
  const abrirReciboDesdePresup = (p) => {
    setReciboFromPresup(p);
    setReciboForm({
      numero: "",
      fecha: new Date().toISOString().split("T")[0],
      concepto: p.conceptos_nombres ? `Honorarios — ${p.conceptos_nombres}` : "Honorarios profesionales",
      monto: p.monto_base || "",
      forma_pago: "efectivo",
      notas: `Presupuesto Nº ${p.numero || "—"}`,
    });
    setShowNuevoRecibo(true);
  };

  const handleGuardarActaEnLegajo = async (client, caratula, expediente, juzgado) => {
    const t = buildActaTexto(client, caratula, expediente, juzgado);
    const contenido = `ACTA PODER\n\n${t.p1}\n\n${t.p2}\n\n${t.p3}\n\n${t.p4}`;
    const blob = new Blob([contenido], { type:"text/plain" });
    const file = new File([blob], `ActaPoder_${t.nombreCliente}.txt`, { type:"text/plain" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Legajo.create({
      client_id: client.id,
      client_name: client.full_name,
      numero_legajo: client.numero_legajo || "",
      titulo: `Acta Poder — ${actaContraparte?.apellido || ""}, ${actaContraparte?.nombre || ""}`,
      tipo_documento: "poder_notarial",
      file_url,
      notas: `Carátula: ${caratula}. Juzgado: ${juzgado}`,
    });
    queryClient.invalidateQueries({ queryKey:["legajos", clientId] });
    alert("Acta guardada en el Legajo ✓");
  };

  function imprimirRecibo(recibo) {
    const w = window.open("", "_blank");
    const hoy = new Date(recibo.fecha + "T12:00:00").toLocaleDateString("es-AR", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Times New Roman",Times,serif;font-size:12pt;background:#fff;color:#222}.page{max-width:800px;margin:0 auto;padding:40px}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e3a5f;padding-bottom:20px;margin-bottom:30px}.logo h1{font-size:22px;font-weight:bold;color:#1e3a5f}.badge{background:#1e3a5f;color:white;padding:8px 20px;border-radius:6px;text-align:center}.badge h2{font-size:18px;font-weight:bold;letter-spacing:2px}.monto-box{background:#f0f7ff;border:2px solid #1e3a5f;border-radius:8px;padding:20px;text-align:center;margin:30px 0}.monto-box .amount{font-size:32px;font-weight:bold;color:#1e3a5f;margin:8px 0}.firmas{display:flex;justify-content:space-between;margin-top:60px}.firma{text-align:center;width:200px}.firma .linea{border-top:1px solid #444;padding-top:8px;font-size:12px}@media print{@page{size:A4}body{margin:0}.page{max-width:100%}}</style></head><body><div class="page"><div class="header"><div class="logo"><h1>Pérez &amp; Funes</h1><p>Estudio Jurídico · San Luis</p></div><div class="badge"><h2>RECIBO</h2><p>Nº ${recibo.numero || "—"}</p></div></div><p style="font-size:11px;color:#888;margin-bottom:18px">Fecha: ${hoy} &nbsp;·&nbsp; Forma de pago: ${formaPagoLabels[recibo.forma_pago] || recibo.forma_pago}</p><p style="font-size:14px;margin-bottom:12px">Recibimos de: <strong>${recibo.client_name}</strong></p><p style="background:#f9f9f9;border-left:4px solid #1e3a5f;padding:12px 16px;margin-bottom:8px">En concepto de: ${recibo.concepto}</p><div class="monto-box"><div style="font-size:12px;color:#666;text-transform:uppercase">La suma de</div><div class="amount">${formatPesos(recibo.monto)}</div></div>${recibo.notas ? `<p style="font-size:11px;color:#666;margin-top:10px">Observaciones: ${recibo.notas}</p>` : ""}<div class="firmas"><div class="firma"><div class="linea">Firma del receptor</div></div><div class="firma"><div class="linea">Sello del estudio</div></div></div></div></body></html>`);
    w.document.close();
    w.print();
  }

  if (isLoading || !client) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const isJuridica = (editing ? form.client_type : client.client_type) === "persona_juridica";
  const nombreDisplay = client.client_type === "persona_juridica" ? (client.razon_social || client.full_name) : (client.apellido ? `${client.apellido}, ${client.nombre}` : client.full_name);
  const totalRecibos = recibos.reduce((s, r) => s + (r.monto || 0), 0);

  return (
    <div className="min-h-full bg-background">

      {/* ── HEADER ── */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
            {(client.full_name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-serif font-bold truncate">{nombreDisplay}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {client.numero_legajo && <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">Legajo Nº {client.numero_legajo}</span>}
              <Badge variant={client.status === "activo" ? "default" : "secondary"} className="text-xs">{client.status === "activo" ? "Activo" : "Inactivo"}</Badge>
              <Badge variant="outline" className="text-xs">{client.client_type === "persona_juridica" ? "Persona Jurídica" : "Persona Física"}</Badge>
            </div>
          </div>

        </div>
        <div className="px-6 lg:px-8 flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="px-6 lg:px-8 py-6 max-w-5xl mx-auto">

        {/* ═══ PERFIL ═══ */}
        {activeTab === "perfil" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              {!editing ? (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { startEdit(); setEditing(true); }}>
                  <Pencil className="w-3.5 h-3.5" /> Editar datos
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /> Cancelar</Button>
                  <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={updateClient.isPending}><Check className="w-3.5 h-3.5" />{updateClient.isPending ? "Guardando..." : "Guardar"}</Button>
                </div>
              )}
            </div>
            {!editing ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm"><CardContent className="p-5 space-y-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">{isJuridica ? "Datos de la Empresa" : "Datos Personales"}</p>
                  {isJuridica ? (<><InfoRow icon={Building2} label="Razón Social" value={client.razon_social} /><InfoRow icon={CreditCard} label="CUIT" value={client.dni_cuit} /><InfoRow icon={FileText} label="Condición IVA" value={condicionIvaLabels[client.condicion_iva]} /></>) : (<><InfoRow icon={User} label="Nombre completo" value={`${client.nombre||""} ${client.apellido||""}`.trim()} /><InfoRow icon={CreditCard} label={client.tipo_dni||"DNI"} value={client.dni_cuit} /><InfoRow icon={User} label="Estado Civil" value={estadoCivilLabels[client.estado_civil]} /><InfoRow icon={Briefcase} label="Ocupación" value={client.ocupacion} /></>)}
                </CardContent></Card>
                {isJuridica && (<Card className="border-0 shadow-sm"><CardContent className="p-5 space-y-4"><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">Representante Legal</p><InfoRow icon={User} label="Nombre y Apellido" value={client.representante_legal} /><InfoRow icon={CreditCard} label="DNI" value={client.dni_representante} /></CardContent></Card>)}
                <Card className="border-0 shadow-sm"><CardContent className="p-5 space-y-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">Contacto y Domicilio</p>
                  <InfoRow icon={Phone} label="Teléfono" value={client.phone} /><InfoRow icon={Mail} label="Email" value={client.email} /><InfoRow icon={MapPin} label="Domicilio" value={client.address} /><InfoRow icon={MapPin} label="Localidad" value={client.localidad} />
                </CardContent></Card>
                {(client.datos_a_tener_en_cuenta || client.notes) && (
                  <Card className="border-0 shadow-sm"><CardContent className="p-5 space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">Notas</p>
                    {client.datos_a_tener_en_cuenta && (<div className="flex gap-3"><div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center shrink-0"><AlertCircle className="w-3.5 h-3.5 text-amber-600" /></div><div><p className="text-xs text-muted-foreground">Datos a tener en cuenta</p><p className="text-sm whitespace-pre-wrap">{client.datos_a_tener_en_cuenta}</p></div></div>)}
                    {client.notes && (<div className="flex gap-3"><div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0"><FileText className="w-3.5 h-3.5 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Notas internas</p><p className="text-sm whitespace-pre-wrap">{client.notes}</p></div></div>)}
                  </CardContent></Card>
                )}
              </div>
            ) : (
              <Card className="border-0 shadow-sm"><CardContent className="p-6 grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Nº de Legajo</Label><Input value={form.numero_legajo} onChange={e => setForm({...form,numero_legajo:e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Estado</Label><Select value={form.status} onValueChange={v => setForm({...form,status:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="activo">Activo</SelectItem><SelectItem value="inactivo">Inactivo</SelectItem></SelectContent></Select></div>
                </div>
                <div className="grid gap-2"><Label>Tipo de cliente</Label><Select value={form.client_type} onValueChange={v => setForm({...form,client_type:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="persona_fisica">Persona Física</SelectItem><SelectItem value="persona_juridica">Persona Jurídica</SelectItem></SelectContent></Select></div>
                {isJuridica ? (<>
                  <div className="grid gap-2"><Label>Razón Social</Label><Input value={form.razon_social} onChange={e => setForm({...form,razon_social:e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>CUIT</Label><Input value={form.dni_cuit} onChange={e => setForm({...form,dni_cuit:e.target.value})} /></div><div className="grid gap-2"><Label>Condición IVA</Label><Select value={form.condicion_iva} onValueChange={v => setForm({...form,condicion_iva:v})}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{Object.entries(condicionIvaLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div></div>
                  <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Representante Legal</Label><Input value={form.representante_legal} onChange={e => setForm({...form,representante_legal:e.target.value})} /></div><div className="grid gap-2"><Label>DNI Representante</Label><Input value={form.dni_representante} onChange={e => setForm({...form,dni_representante:e.target.value})} /></div></div>
                </>) : (<>
                  <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Nombre/s</Label><Input value={form.nombre} onChange={e => setForm({...form,nombre:e.target.value})} /></div><div className="grid gap-2"><Label>Apellido/s</Label><Input value={form.apellido} onChange={e => setForm({...form,apellido:e.target.value})} /></div></div>
                  <div className="grid grid-cols-3 gap-4"><div className="grid gap-2"><Label>Tipo doc.</Label><Select value={form.tipo_dni} onValueChange={v => setForm({...form,tipo_dni:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["DNI","CUIT","CUIL","Pasaporte","Otro"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2 col-span-2"><Label>Nº {form.tipo_dni||"DNI"}</Label><Input value={form.dni_cuit} onChange={e => setForm({...form,dni_cuit:e.target.value})} /></div></div>
                  <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Estado Civil</Label><Select value={form.estado_civil} onValueChange={v => setForm({...form,estado_civil:v})}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{Object.entries(estadoCivilLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Ocupación</Label><Input value={form.ocupacion} onChange={e => setForm({...form,ocupacion:e.target.value})} /></div></div>
                </>)}
                <div className="grid gap-2"><Label>Domicilio</Label><Input value={form.address} onChange={e => setForm({...form,address:e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Localidad</Label><Input value={form.localidad} onChange={e => setForm({...form,localidad:e.target.value})} /></div><div className="grid gap-2"><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} /></div></div>
                <div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} /></div>
                <div className="grid gap-2"><Label>Datos a tener en cuenta</Label><Textarea value={form.datos_a_tener_en_cuenta} onChange={e => setForm({...form,datos_a_tener_en_cuenta:e.target.value})} rows={3} /></div>
                <div className="grid gap-2"><Label>Notas internas</Label><Textarea value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} rows={2} /></div>
              </CardContent></Card>
            )}
          </div>
        )}

        {/* ═══ ESTUDIO DE CASO ═══ */}
        {activeTab === "casos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2"><BookMarked className="w-5 h-5" /> Estudio de Caso</h2>
              <Button size="sm" className="gap-1.5" onClick={() => setShowNuevoCaso(true)}>
                <Plus className="w-4 h-4" /> Nuevo Caso
              </Button>
            </div>
            {casos.length === 0 ? (
              <Card className="border-dashed border-2 shadow-none">
                <CardContent className="py-14 text-center">
                  <BookMarked className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground mb-4">No hay casos registrados para este cliente</p>
                  <Button onClick={() => setShowNuevoCaso(true)} className="gap-2"><Plus className="w-4 h-4" /> Crear primer caso</Button>
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
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoCasoColors[caso.estado] || "bg-gray-100 text-gray-600"}`}>{caso.estado === "en_analisis" ? "En análisis" : caso.estado?.charAt(0).toUpperCase() + caso.estado?.slice(1)}</span>
                            {caso.tipo_caso && <Badge variant="outline" className="text-xs">{tipoCasoLabels[caso.tipo_caso] || caso.tipo_caso}</Badge>}
                            {caso.numero_expediente && <span className="text-xs text-muted-foreground">Expte. {caso.numero_expediente}</span>}
                          </div>
                          <h3 className="font-semibold">{caso.titulo}</h3>
                          {caso.jurisdiccion && <p className="text-xs text-muted-foreground mt-0.5">{caso.jurisdiccion}</p>}
                          {caso.descripcion && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{caso.descripcion}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p className="text-xs text-muted-foreground">{caso.created_date ? format(new Date(caso.created_date), "d MMM yyyy", { locale:es }) : ""}</p>
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { window.location.href = "/estudio-caso"; }}>
                            <ExternalLink className="w-3.5 h-3.5" /> Abrir en Estudio
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ PRESUPUESTOS ═══ */}
        {activeTab === "presupuestos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2"><FilePlus className="w-5 h-5" /> Presupuestos</h2>
              <Button size="sm" className="gap-1.5" onClick={() => { window.location.href = "/presupuestos"; }}>
                <Plus className="w-4 h-4" /> Nuevo Presupuesto
              </Button>
            </div>
            {presupuestos.length === 0 ? (
              <Card className="border-dashed border-2 shadow-none">
                <CardContent className="py-14 text-center">
                  <FilePlus className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground mb-4">No hay presupuestos para este cliente</p>
                  <Button onClick={() => { window.location.href = "/presupuestos"; }} className="gap-2"><Plus className="w-4 h-4" /> Crear presupuesto</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {presupuestos.map(p => (
                  <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {p.numero && <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">#{p.numero}</span>}
                            <Badge variant={p.estado === "aceptado" ? "default" : p.estado === "vencido" ? "destructive" : "secondary"} className="text-xs">{p.estado || "vigente"}</Badge>
                          </div>
                          {p.conceptos_nombres && <p className="text-sm text-muted-foreground">{p.conceptos_nombres}</p>}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                            {p.fecha_emision && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(p.fecha_emision + "T12:00:00"), "d MMM yyyy", { locale:es })}</span>}
                            {p.fecha_vencimiento && <span className="text-amber-600">Vence: {format(new Date(p.fecha_vencimiento + "T12:00:00"), "d MMM yyyy", { locale:es })}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <p className="text-lg font-bold text-primary">{formatPesos(p.monto_base)}</p>
                          <p className="text-xs text-muted-foreground">+ IVA</p>
                          {p.monto_efectivo_desc > 0 && <p className="text-xs text-green-700">Efectivo: {formatPesos(p.monto_efectivo_desc)}</p>}
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs w-full mt-2" onClick={() => abrirReciboDesdePresup(p)}>
                            <Receipt className="w-3.5 h-3.5" /> Cargar en Recibo
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ RECIBOS ═══ */}
        {activeTab === "recibos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2"><Receipt className="w-5 h-5" /> Recibos</h2>
              <div className="flex items-center gap-3">
                {recibos.length > 0 && <span className="text-sm font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg">Total cobrado: {formatPesos(totalRecibos)}</span>}
                <Button size="sm" className="gap-1.5" onClick={() => { setReciboFromPresup(null); setReciboForm({ numero:"", fecha:new Date().toISOString().split("T")[0], concepto:"", monto:"", forma_pago:"efectivo", notas:"" }); setShowNuevoRecibo(true); }}>
                  <Plus className="w-4 h-4" /> Nuevo Recibo
                </Button>
              </div>
            </div>
            {recibos.length === 0 ? (
              <Card className="border-dashed border-2 shadow-none">
                <CardContent className="py-12 text-center">
                  <Receipt className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground mb-4">No hay recibos para este cliente</p>
                  <Button onClick={() => { setShowNuevoRecibo(true); }} className="gap-2"><Plus className="w-4 h-4" /> Emitir primer recibo</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recibos.map(r => (
                  <Card key={r.id} className="border-0 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {r.numero && <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">#{r.numero}</span>}
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{formaPagoLabels[r.forma_pago] || r.forma_pago}</span>
                        </div>
                        <p className="text-sm font-medium">{r.concepto}</p>
                        {r.fecha && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(r.fecha + "T12:00:00"), "d 'de' MMMM yyyy", { locale:es })}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-xl font-bold text-green-700">{formatPesos(r.monto)}</p>
                        <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => imprimirRecibo({ ...r, client_name:client.full_name })}>
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ LEGAJO ═══ */}
        {activeTab === "legajo" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2"><FolderOpen className="w-5 h-5" /> Legajo — Repositorio de Documentos</h2>
              <Button size="sm" className="gap-1.5" onClick={() => setShowSubirLegajo(true)}>
                <Upload className="w-4 h-4" /> Subir Documento
              </Button>
            </div>
            <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              📁 Los documentos del legajo pueden ser utilizados como repositorio en el Estudio de Caso para análisis con IA.
            </p>
            {legajos.length === 0 ? (
              <Card className="border-dashed border-2 shadow-none">
                <CardContent className="py-14 text-center">
                  <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground mb-4">El legajo no tiene documentos aún</p>
                  <Button onClick={() => setShowSubirLegajo(true)} className="gap-2"><Upload className="w-4 h-4" /> Subir primer documento</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {legajos.map(doc => (
                  <div key={doc.id} className="group relative border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-all">
                    <div className="aspect-[3/4] bg-muted/40 cursor-pointer overflow-hidden relative" onClick={() => setPreviewLegajo(doc.file_url)}>
                      {doc.file_url ? (
                        <img src={doc.file_url} alt={doc.titulo} className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" onError={e => { e.target.style.display="none"; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><FileText className="w-8 h-8 text-muted-foreground/30" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow" onClick={e => { e.stopPropagation(); setPreviewLegajo(doc.file_url); }}><Eye className="w-4 h-4 text-primary" /></button>
                        <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow" onClick={e => { e.stopPropagation(); deleteLegajo.mutate(doc.id); }}><Trash2 className="w-4 h-4 text-destructive" /></button>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold truncate">{doc.titulo}</p>
                      <Badge className={`text-[10px] mt-1 ${tipoDocColors[doc.tipo_documento] || "bg-muted text-muted-foreground"}`} variant="secondary">{tipoDocLabels[doc.tipo_documento] || doc.tipo_documento}</Badge>
                      {doc.fecha_documento && <p className="text-[10px] text-muted-foreground mt-0.5">{doc.fecha_documento}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ CONTRAPARTES ═══ */}
        {activeTab === "contrapartes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5" /> Contrapartes</h2>
              <Badge variant="outline">{contrapartes.length} registrada{contrapartes.length !== 1 ? "s" : ""}</Badge>
            </div>
            {contrapartes.length === 0 ? (
              <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center"><Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No hay contrapartes registradas</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {contrapartes.map(cp => (
                  <Card key={cp.id} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">{cp.apellido?.charAt(0)?.toUpperCase() || "?"}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 flex-1">
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
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs shrink-0" onClick={() => {
                          const nombreCliente = client.client_type === "persona_juridica" ? (client.razon_social || client.full_name) : `${client.apellido||""} ${client.nombre||""}`.trim().toUpperCase();
                          setActaContraparte(cp);
                          setActaData({ caratula:`${nombreCliente} C/ ${cp.apellido.toUpperCase()} ${cp.nombre.toUpperCase()} S/ `, expediente:"", juzgado:"Juzgado de Familia N° 2" });
                          setActaConfirmada(false);
                          setShowActaModal(true);
                        }}>
                          <FileText className="w-3.5 h-3.5" /> Acta Poder
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════ MODALES OPERATIVOS ════════════════ */}

      {/* Nuevo Caso */}
      <Dialog open={showNuevoCaso} onOpenChange={setShowNuevoCaso}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif flex items-center gap-2"><BookMarked className="w-5 h-5" /> Nuevo Caso — {client.full_name?.split(" ")[0]}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Título / Carátula *</Label><Input placeholder="Ej: GARCÍA C/ LÓPEZ S/ ALIMENTOS" value={casForm.titulo} onChange={e => setCasForm({...casForm,titulo:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Tipo de caso</Label><Select value={casForm.tipo_caso} onValueChange={v => setCasForm({...casForm,tipo_caso:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(tipoCasoLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Estado</Label><Select value={casForm.estado} onValueChange={v => setCasForm({...casForm,estado:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="activo">Activo</SelectItem><SelectItem value="en_analisis">En análisis</SelectItem><SelectItem value="archivado">Archivado</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Nº Expediente</Label><Input placeholder="Ej: 404658/23" value={casForm.numero_expediente} onChange={e => setCasForm({...casForm,numero_expediente:e.target.value})} /></div>
              <div className="grid gap-2"><Label>Juzgado / Jurisdicción</Label><Input placeholder="Ej: Juzgado de Familia N° 2" value={casForm.jurisdiccion} onChange={e => setCasForm({...casForm,jurisdiccion:e.target.value})} /></div>
            </div>
            <div className="grid gap-2"><Label>Descripción</Label><Textarea placeholder="Resumen del caso..." value={casForm.descripcion} onChange={e => setCasForm({...casForm,descripcion:e.target.value})} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNuevoCaso(false)}>Cancelar</Button>
            <Button disabled={!casForm.titulo || createCaso.isPending} onClick={() => createCaso.mutate({ ...casForm, client_id:client.id, client_name:client.full_name })}>
              {createCaso.isPending ? "Guardando..." : "Crear Caso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nuevo Recibo */}
      <Dialog open={showNuevoRecibo} onOpenChange={setShowNuevoRecibo}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif flex items-center gap-2"><Receipt className="w-5 h-5" /> {reciboFromPresup ? "Recibo desde Presupuesto" : "Nuevo Recibo"}</DialogTitle></DialogHeader>
          {reciboFromPresup && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
              📋 Pre-cargado desde Presupuesto <strong>#{reciboFromPresup.numero || "—"}</strong> · {formatPesos(reciboFromPresup.monto_base)} base
            </div>
          )}
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Nº Recibo</Label><Input placeholder="2026-001" value={reciboForm.numero} onChange={e => setReciboForm({...reciboForm,numero:e.target.value})} /></div>
              <div className="grid gap-2"><Label>Fecha *</Label><Input type="date" value={reciboForm.fecha} onChange={e => setReciboForm({...reciboForm,fecha:e.target.value})} /></div>
            </div>
            <div className="grid gap-2"><Label>Concepto *</Label><Textarea placeholder="Honorarios..." value={reciboForm.concepto} onChange={e => setReciboForm({...reciboForm,concepto:e.target.value})} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Monto $ *</Label><Input type="number" value={reciboForm.monto} onChange={e => setReciboForm({...reciboForm,monto:e.target.value})} /></div>
              <div className="grid gap-2"><Label>Forma de pago</Label><Select value={reciboForm.forma_pago} onValueChange={v => setReciboForm({...reciboForm,forma_pago:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(formaPagoLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid gap-2"><Label>Observaciones</Label><Input placeholder="Notas adicionales..." value={reciboForm.notas} onChange={e => setReciboForm({...reciboForm,notas:e.target.value})} /></div>
            {reciboForm.monto && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center"><p className="text-xs text-green-600">Monto a recibir</p><p className="text-xl font-bold text-green-700">{formatPesos(parseFloat(reciboForm.monto))}</p></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNuevoRecibo(false); setReciboFromPresup(null); }}>Cancelar</Button>
            <Button disabled={!reciboForm.concepto || !reciboForm.monto || createRecibo.isPending} className="gap-2" onClick={() => createRecibo.mutate({ ...reciboForm, monto:parseFloat(reciboForm.monto)||0, client_id:client.id, client_name:client.full_name })}>
              <Printer className="w-4 h-4" />{createRecibo.isPending ? "Guardando..." : "Guardar e Imprimir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subir Legajo */}
      <Dialog open={showSubirLegajo} onOpenChange={setShowSubirLegajo}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif flex items-center gap-2"><FolderOpen className="w-5 h-5" /> Subir Documento al Legajo</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Título *</Label><Input placeholder="Ej: DNI frente, Acta de nacimiento..." value={legajoForm.titulo} onChange={e => setLegajoForm({...legajoForm,titulo:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Tipo</Label><Select value={legajoForm.tipo_documento} onValueChange={v => setLegajoForm({...legajoForm,tipo_documento:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(tipoDocLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Fecha</Label><Input type="date" value={legajoForm.fecha_documento} onChange={e => setLegajoForm({...legajoForm,fecha_documento:e.target.value})} /></div>
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleFileUpload(e.target.files[0])} />
            {!legajoForm.file_url ? (
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-muted/20">
                {uploading ? (<div className="flex flex-col items-center gap-2"><Loader2 className="w-7 h-7 text-primary animate-spin" /><p className="text-sm text-muted-foreground">Subiendo...</p></div>) : (<><Upload className="w-7 h-7 mx-auto text-muted-foreground/40 mb-2" /><p className="text-sm text-muted-foreground">Hacé clic para subir imagen o PDF</p></>)}
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border">
                <img src={legajoForm.file_url} alt="Vista previa" className="w-full max-h-40 object-contain bg-muted/20" onError={e => { e.target.style.display="none"; }} />
                <div className="p-2 text-center text-xs text-green-600 font-medium">✓ Archivo subido</div>
                <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white" onClick={() => setLegajoForm({...legajoForm,file_url:""})}><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
            <div className="grid gap-2"><Label>Notas</Label><Textarea placeholder="Observaciones..." value={legajoForm.notas} onChange={e => setLegajoForm({...legajoForm,notas:e.target.value})} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubirLegajo(false)}>Cancelar</Button>
            <Button disabled={!legajoForm.titulo || !legajoForm.file_url || createLegajo.isPending || uploading} onClick={() => createLegajo.mutate({ ...legajoForm, client_id:client.id, client_name:client.full_name, numero_legajo:client.numero_legajo||"" })}>
              {createLegajo.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Acta Poder */}
      <Dialog open={showActaModal} onOpenChange={v => { setShowActaModal(v); setActaConfirmada(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif flex items-center gap-2"><FileText className="w-5 h-5" /> Acta Poder — {actaContraparte?.apellido}, {actaContraparte?.nombre}</DialogTitle></DialogHeader>
          {!actaConfirmada ? (
            <>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2"><Label>Carátula del expediente *</Label><Input placeholder="Ej: ROSALES C/ LÓPEZ S/ ALIMENTOS" value={actaData.caratula} onChange={e => setActaData({...actaData,caratula:e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Nº de Expediente</Label><Input placeholder="Ej: 404658/23" value={actaData.expediente} onChange={e => setActaData({...actaData,expediente:e.target.value})} /></div>
                  <div className="grid gap-2"><Label>Juzgado</Label><Input placeholder="Juzgado de Familia N° 2" value={actaData.juzgado} onChange={e => setActaData({...actaData,juzgado:e.target.value})} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowActaModal(false)}>Cancelar</Button>
                <Button onClick={() => setActaConfirmada(true)} disabled={!actaData.caratula}><Eye className="w-4 h-4 mr-1" /> Vista Previa</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {(() => {
                const t = buildActaTexto(client, actaData.caratula, actaData.expediente, actaData.juzgado);
                return (
                  <div className="border rounded-xl bg-white p-6 font-serif text-[13px] leading-relaxed text-black space-y-4 shadow-inner">
                    <h2 className="text-center font-bold text-sm tracking-widest underline">ACTA PODER</h2>
                    <p className="text-justify">{t.p1}</p>
                    <p className="text-justify"><strong>EXPUSO:</strong> Que da y confiere PODER APUD ACTA {t.p2.split("PODER APUD ACTA")[1]}</p>
                    <p className="text-justify">{t.p3}</p>
                    <p className="text-justify">{t.p4}</p>
                    <div className="pt-10 flex justify-center"><div className="text-center border-t border-black w-48 pt-1 text-xs">Firma del Poderdante</div></div>
                  </div>
                );
              })()}
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">✅ Revisá el acta. Podés imprimirla o guardarla en el Legajo.</p>
              <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
                <Button variant="outline" onClick={() => setActaConfirmada(false)}>Volver a editar</Button>
                <Button variant="outline" className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50" onClick={async () => { await handleGuardarActaEnLegajo(client, actaData.caratula, actaData.expediente, actaData.juzgado); setShowActaModal(false); }}>
                  <Save className="w-4 h-4" /> Guardar en Legajo
                </Button>
                <Button className="gap-1.5" onClick={() => imprimirActaPoder(client, actaData.caratula, actaData.expediente, actaData.juzgado)}>
                  <Printer className="w-4 h-4" /> Imprimir
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Legajo */}
      <Dialog open={!!previewLegajo} onOpenChange={() => setPreviewLegajo(null)}>
        <DialogContent className="max-w-3xl p-2">
          <div className="relative">
            <button className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white" onClick={() => setPreviewLegajo(null)}><X className="w-4 h-4" /></button>
            {previewLegajo && <img src={previewLegajo} alt="Vista previa" className="w-full max-h-[80vh] object-contain rounded-lg" />}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}