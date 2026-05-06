import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, FileText, Users, Download, Printer, Eye } from "lucide-react";

const condicionLaboralLabels = {
  empleado: "Empleado",
  independiente: "Independiente / Autónomo",
  jubilado: "Jubilado",
  pensionado: "Pensionado",
  otro: "Otro",
};

const emptyForm = {
  nombre: "", apellido: "", domicilio: "", localidad: "San Luis",
  dni_cuit: "", tipo_doc: "DNI", telefono: "",
  condicion_laboral: "", condicion_laboral_otro: "",
  donde_trabaja: "", parentesco: "", notas: "",
};

function buildActaTexto(client, caratula, expediente, juzgado) {
  const hoy = new Date();
  const diasMes = hoy.getDate();
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const mes = meses[hoy.getMonth()];
  const anio = hoy.getFullYear();

  const nombreCliente = client.client_type === "persona_juridica"
    ? (client.razon_social || client.full_name || "").toUpperCase()
    : `${client.nombre || ""} ${client.apellido || ""}`.trim().toUpperCase();

  const dniCliente = client.dni_cuit || "___________";
  const tipoDniCliente = client.client_type === "persona_juridica" ? "CUIT" : (client.tipo_dni || "DNI");
  const domicilioCliente = [client.address, client.localidad].filter(Boolean).join(", ") || "___________";
  const expteStr = expediente ? ` EXPTE. ${expediente}` : "";

  return {
    nombreCliente, dniCliente, tipoDniCliente, domicilioCliente,
    diasMes, mes, anio, expteStr,
    p1: `En la Ciudad de San Luis, capital de la provincia del mismo nombre, República Argentina, a los ${diasMes} días del mes de ${mes} de ${anio}, comparece ante ${juzgado || "los Juzgados de Familia, Niñez y Adolescencia"}, la señora/el señor ${nombreCliente}, argentina/o, mayor de edad, habiendo acreditado su identidad con el ${tipoDniCliente} N° ${dniCliente}, con domicilio en calle ${domicilioCliente}.`,
    p2: `EXPUSO: Que da y confiere PODER APUD ACTA a favor de la Dra. Silvia Raquel Pérez Arce, Abogada, Matrícula Profesional 2571 del CAPSL y a la Dra. María Valeria Funes Mat. 3081 CAPSL, correo electrónico silviaperezarce@giajsanluis.gov.ar, domicilio legal constituido en 25 de Mayo 477 Ciudad, para que en su nombre y representación intervenga en los autos caratulados "${caratula || "___________________________________"}"${expteStr}, expediente radicado en ${juzgado || "Juzgado de Familia N° ___"}.`,
    p3: `Al efecto faculta para que las represente ante las autoridades que correspondan, con escritos, documentos, pudiendo entablar y contestar demandas, contrademandas, reconvenir, apelar, interponer todos los recursos y desistir, decir de nulidad, prestar y exigir juramentos, declinar y prorrogar jurisdicciones, oponer o absolver posiciones, oponer o renunciar a prescripciones, oponer y contestar excepciones, comprometer en árbitros o arbitradores, reconocer o impugnar obligaciones, solicitar embargos preventivos definitivos y sus cancelaciones, inhibiciones y sus levantamientos, solicitar reconocimiento de firmas, sus cotejos y designar toda clase de peritos, asistir a las audiencias y comparendos, con la facultad de hacer preguntas y presentar interrogatorios, solicitar diligencias e inscribir oficios, mandamientos y exhortos y todo cuanto otra facultad le fuere necesaria para el cumplimiento del presente mandato. Las facultades enunciadas son de mero carácter enumerativo, y en ningún caso limitativas: NO SE AUTORIZA A LA LETRADA COBRO ALGUNO EN REPRESENTACIÓN DEL PODERDANTE.`,
    p4: `Con lo que se dio por terminado el acto, previa lectura y ratificación de su contenido, firma el compareciente. ANTE MÍ QUE DOY FE.-`,
  };
}

function descargarWord(client, caratula, expediente, juzgado) {
  const t = buildActaTexto(client, caratula, expediente, juzgado);

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
  @page { size: A4; margin: 2.5cm 3cm; mso-page-orientation: portrait; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.8; color: #000; }
  h1 { font-size: 14pt; font-weight: bold; text-align: center; letter-spacing: 3px; text-decoration: underline; margin-bottom: 24pt; margin-top: 0; }
  p { text-align: justify; margin-bottom: 12pt; font-size: 12pt; }
  .firma-wrap { margin-top: 60pt; text-align: center; }
  .firma-line { display: inline-block; border-top: 1px solid #000; width: 220pt; padding-top: 4pt; font-size: 10pt; }
</style>
</head>
<body>
<h1>ACTA PODER</h1>
<p>${t.p1}</p>
<p>${t.p2}</p>
<p>${t.p3}</p>
<p>${t.p4}</p>
<div class="firma-wrap"><div class="firma-line">Firma del Poderdante</div></div>
</body></html>`;

  const blob = new Blob(['\ufeff', html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ActaPoder_${(t.nombreCliente).replace(/\s+/g, "_")}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

function imprimirActaPoder(client, caratula, expediente, juzgado) {
  const t = buildActaTexto(client, caratula, expediente, juzgado);
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #000; background: #fff; }
    .page { width: 21cm; min-height: 29.7cm; margin: 0 auto; padding: 2.5cm 3cm; line-height: 1.8; }
    h1 { font-size: 14pt; font-weight: bold; text-align: center; letter-spacing: 3px; margin-bottom: 24pt; text-decoration: underline; }
    p { text-align: justify; margin-bottom: 12pt; }
    .firma-area { margin-top: 60pt; text-align: center; }
    .firma-box { display: inline-block; text-align: center; width: 220pt; border-top: 1px solid #000; padding-top: 6pt; font-size: 10pt; }
    @media print { @page { size: A4; margin: 2.5cm 3cm; } body { margin: 0; } .page { padding: 0; width: 100%; } }
  </style>
  </head><body>
  <div class="page">
    <h1>ACTA PODER</h1>
    <p>${t.p1}</p>
    <p>${t.p2}</p>
    <p>${t.p3}</p>
    <p>${t.p4}</p>
    <div class="firma-area"><div class="firma-box">Firma del Poderdante</div></div>
  </div>
  </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

export default function ContraparteModal({ client, open, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showActaModal, setShowActaModal] = useState(false);
  const [actaData, setActaData] = useState({ caratula: "", expediente: "", juzgado: "Juzgado de Familia N° 2" });
  const [actaConfirmada, setActaConfirmada] = useState(false);
  const queryClient = useQueryClient();

  const { data: contrapartes = [] } = useQuery({
    queryKey: ["contrapartes", client?.id],
    queryFn: () => base44.entities.Contraparte.filter({ client_id: client.id }),
    enabled: !!client?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contraparte.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contrapartes", client.id] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contraparte.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contrapartes", client.id] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contraparte.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contrapartes", client.id] }),
  });

  const resetForm = () => { setForm(emptyForm); setEditing(null); setShowForm(false); };

  const openEdit = (c) => { setEditing(c); setForm({ ...emptyForm, ...c }); setShowForm(true); };

  const handleSubmit = () => {
    const data = { ...form, client_id: client.id };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const isValid = form.nombre && form.apellido && form.dni_cuit && form.domicilio;

  const handleGenerarActa = (contraparte) => {
    const nombreCliente = client.client_type === "persona_juridica"
      ? client.razon_social || client.full_name
      : `${client.apellido || ""} ${client.nombre || ""}`.trim().toUpperCase();
    setActaData({
      caratula: `${nombreCliente} C/ ${contraparte.apellido.toUpperCase()} ${contraparte.nombre.toUpperCase()} S/ `,
      expediente: "",
      juzgado: "Juzgado de Familia N° 2",
      contraparte,
    });
    setActaConfirmada(false);
    setShowActaModal(true);
  };

  if (!client) return null;

  const nombreCliente = client.client_type === "persona_juridica"
    ? client.razon_social || client.full_name
    : `${client.nombre || ""} ${client.apellido || ""}`.trim();

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Users className="w-5 h-5" /> Contrapartes — {nombreCliente}
            </DialogTitle>
          </DialogHeader>

          {/* Lista de contrapartes existentes */}
          {contrapartes.length > 0 && (
            <div className="space-y-2 mb-2">
              {contrapartes.map(cp => (
                <div key={cp.id} className="border rounded-xl p-4 bg-muted/30 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{cp.apellido}, {cp.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {cp.tipo_doc}: {cp.dni_cuit}
                        {cp.parentesco ? ` · ${cp.parentesco}` : ""}
                        {cp.condicion_laboral ? ` · ${condicionLaboralLabels[cp.condicion_laboral] || cp.condicion_laboral}` : ""}
                      </p>
                      {cp.domicilio && <p className="text-xs text-muted-foreground">{cp.domicilio}{cp.localidad ? `, ${cp.localidad}` : ""}</p>}
                      {cp.donde_trabaja && <p className="text-xs text-muted-foreground">Trabaja en: {cp.donde_trabaja}</p>}
                      {cp.telefono && <p className="text-xs text-muted-foreground">Tel: {cp.telefono}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleGenerarActa(cp)}>
                        <FileText className="w-3 h-3" /> Acta Poder
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(cp)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(cp.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botón agregar */}
          {!showForm && (
            <Button variant="outline" className="gap-2 w-full" onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(true); }}>
              <Plus className="w-4 h-4" /> Agregar Contraparte
            </Button>
          )}

          {/* Formulario */}
          {showForm && (
            <div className="border rounded-xl p-4 space-y-4 bg-muted/10">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {editing ? "Editar Contraparte" : "Nueva Contraparte"}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Nombre/s <span className="text-destructive">*</span></Label>
                  <Input placeholder="Ej: María José" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Apellido/s <span className="text-destructive">*</span></Label>
                  <Input placeholder="Ej: González" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-1.5">
                  <Label>Tipo Doc.</Label>
                  <Select value={form.tipo_doc} onValueChange={v => setForm({ ...form, tipo_doc: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="CUIT">CUIT</SelectItem>
                      <SelectItem value="CUIL">CUIL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5 col-span-2">
                  <Label>Nº {form.tipo_doc} <span className="text-destructive">*</span></Label>
                  <Input placeholder="Ej: 28.456.789" value={form.dni_cuit} onChange={e => setForm({ ...form, dni_cuit: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Domicilio <span className="text-destructive">*</span></Label>
                  <Input placeholder="Calle y número" value={form.domicilio} onChange={e => setForm({ ...form, domicilio: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Localidad</Label>
                  <Input placeholder="Ej: San Luis" value={form.localidad} onChange={e => setForm({ ...form, localidad: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Teléfono</Label>
                  <Input placeholder="Ej: 2664 123456" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Parentesco / Vínculo</Label>
                  <Input placeholder="Ej: Cónyuge, Empleador, Padre..." value={form.parentesco} onChange={e => setForm({ ...form, parentesco: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Condición Laboral</Label>
                  <Select value={form.condicion_laboral} onValueChange={v => setForm({ ...form, condicion_laboral: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(condicionLaboralLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{form.condicion_laboral === "otro" ? "Especificar" : "Dónde trabaja"}</Label>
                  {form.condicion_laboral === "otro" ? (
                    <Input placeholder="Especificar condición" value={form.condicion_laboral_otro} onChange={e => setForm({ ...form, condicion_laboral_otro: e.target.value })} />
                  ) : (
                    <Input placeholder="Empresa o institución" value={form.donde_trabaja} onChange={e => setForm({ ...form, donde_trabaja: e.target.value })} />
                  )}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Notas</Label>
                <Textarea placeholder="Observaciones adicionales..." value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
                <Button size="sm" onClick={handleSubmit} disabled={!isValid}>
                  {editing ? "Guardar Cambios" : "Agregar Contraparte"}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Acta Poder */}
      <Dialog open={showActaModal} onOpenChange={(v) => { setShowActaModal(v); setActaConfirmada(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <FileText className="w-5 h-5" /> Acta Poder
            </DialogTitle>
          </DialogHeader>

          {!actaConfirmada ? (
            <>
              <div className="grid gap-4 py-2">
                <div className="p-3 rounded-lg bg-muted/40 border text-sm space-y-0.5">
                  <p className="font-medium">Poderdante: <span className="font-normal">{nombreCliente}</span></p>
                  {actaData.contraparte && (
                    <p className="font-medium">Contraparte: <span className="font-normal">{actaData.contraparte?.apellido}, {actaData.contraparte?.nombre}</span></p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label>Carátula del expediente <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Ej: ROSALES ANDREA C/ LÓPEZ MARIO S/ ALIMENTOS"
                    value={actaData.caratula}
                    onChange={e => setActaData({ ...actaData, caratula: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label>N° de Expediente</Label>
                    <Input placeholder="Ej: 404658/23" value={actaData.expediente} onChange={e => setActaData({ ...actaData, expediente: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Juzgado</Label>
                    <Input placeholder="Ej: Juzgado de Familia N° 2" value={actaData.juzgado} onChange={e => setActaData({ ...actaData, juzgado: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowActaModal(false)}>Cancelar</Button>
                <Button className="gap-2" onClick={() => setActaConfirmada(true)} disabled={!actaData.caratula}>
                  <Eye className="w-4 h-4" /> Vista Previa
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {/* Vista previa del acta */}
              {(() => {
                const t = buildActaTexto(client, actaData.caratula, actaData.expediente, actaData.juzgado);
                return (
                  <div className="border rounded-xl bg-white p-6 font-serif text-[13px] leading-relaxed text-black space-y-4 shadow-inner">
                    <h2 className="text-center font-bold text-sm tracking-widest underline">ACTA PODER</h2>
                    <p className="text-justify">{t.p1}</p>
                    <p className="text-justify"><strong>EXPUSO:</strong> {t.p2.replace("EXPUSO: ", "")}</p>
                    <p className="text-justify">{t.p3}</p>
                    <p className="text-justify">{t.p4}</p>
                    <div className="pt-10 flex justify-center">
                      <div className="text-center border-t border-black w-48 pt-1 text-xs">Firma del Poderdante</div>
                    </div>
                  </div>
                );
              })()}
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                ✅ Revisá el acta. Luego descargala como Word o imprimila para que el cliente firme.
              </p>
              <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
                <Button variant="outline" onClick={() => setActaConfirmada(false)} className="gap-2">
                  Volver a editar
                </Button>
                <Button variant="outline" className="gap-2 text-blue-700 border-blue-300 hover:bg-blue-50"
                  onClick={() => descargarWord(client, actaData.caratula, actaData.expediente, actaData.juzgado)}>
                  <Download className="w-4 h-4" /> Descargar Word
                </Button>
                <Button className="gap-2"
                  onClick={() => { imprimirActaPoder(client, actaData.caratula, actaData.expediente, actaData.juzgado); }}>
                  <Printer className="w-4 h-4" /> Confirmar e Imprimir
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}