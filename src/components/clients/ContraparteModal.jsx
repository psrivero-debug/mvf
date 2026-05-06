import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

function imprimirActaPoder(client, contraparte, caratula, expediente, juzgado) {
  const hoy = new Date();
  const diasMes = hoy.getDate();
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const mes = meses[hoy.getMonth()];
  const anio = hoy.getFullYear();

  const nombreCliente = client.client_type === "persona_juridica"
    ? client.razon_social || client.full_name
    : `${client.nombre || ""} ${client.apellido || ""}`.trim().toUpperCase();

  const dniCliente = client.dni_cuit || "___________";
  const tipoDniCliente = client.client_type === "persona_juridica" ? "CUIT" : (client.tipo_dni || "DNI");
  const domicilioCliente = [client.address, client.localidad].filter(Boolean).join(", ") || "___________";

  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Times New Roman", Times, serif; font-size: 13pt; color: #000; background: #fff; }
    .page { max-width: 820px; margin: 0 auto; padding: 60px 70px; line-height: 1.9; }
    h1 { font-size: 16pt; font-weight: bold; text-align: center; letter-spacing: 4px; margin-bottom: 40px; text-decoration: underline; }
    p { text-align: justify; margin-bottom: 18px; }
    .firma-area { margin-top: 80px; display: flex; justify-content: center; }
    .firma-box { text-align: center; width: 260px; border-top: 1px solid #000; padding-top: 8px; font-size: 11pt; }
    @media print { body { margin: 0; } .page { padding: 40px 60px; max-width: 100%; } }
  </style>
  </head><body>
  <div class="page">
    <h1>ACTA PODER</h1>
    <p>En la Ciudad de San Luis, capital de la provincia del mismo nombre, República Argentina, a los <strong>${diasMes}</strong> días del mes de <strong>${mes}</strong> de <strong>${anio}</strong>, comparece ante los Juzgados de ${juzgado || "Familia, Niñez y Adolescencia"}, la señora/el señor <strong>${nombreCliente}</strong>, argentina/o, mayor de edad, habiendo acreditado su identidad con el <strong>${tipoDniCliente} N° ${dniCliente}</strong>, con domicilio en calle <strong>${domicilioCliente}</strong>.</p>

    <p><strong>EXPUSO:</strong> Que da y confiere <strong>PODER APUD ACTA</strong> a favor de la Dra. Silvia Raquel Pérez Arce, Abogada, Matrícula Profesional 2571 del CAPSL y a la Dra. María Valeria Funes Mat. 3081 CAPSL, correo electrónico silviaperezarce@giajsanluis.gov.ar, domicilio legal constituido en 25 de Mayo 477 Ciudad, para que en su nombre y representación intervenga en los autos caratulados <strong>"${caratula || "___________________________________"}"</strong>${expediente ? ` EXPTE. <strong>${expediente}</strong>` : ""}, expediente radicado en <strong>${juzgado || "Juzgado de Familia N° ___"}</strong>.</p>

    <p>Al efecto faculta para que las represente ante las autoridades que correspondan, con escritos, documentos, pudiendo entablar y contestar demandas, contrademandas, reconvenir, apelar, interponer todos los recursos y desistir, decir de nulidad, prestar y exigir juramentos, declinar y prorrogar jurisdicciones, oponer o absolver posiciones, oponer o renunciar a prescripciones, oponer y contestar excepciones, comprometer en árbitros o arbitradores, reconocer o impugnar obligaciones, solicitar embargos preventivos definitivos y sus cancelaciones, inhibiciones y sus levantamientos, solicitar reconocimiento de firmas, sus cotejos y designar toda clase de peritos, asistir a las audiencias y comparendos, con la facultad de hacer preguntas y presentar interrogatorios, solicitar diligencias e inscribir oficios, mandamientos y exhortos y todo cuanto otra facultad le fuere necesaria para el cumplimiento del presente mandato. Las facultades enunciadas son de mero carácter enumerativo, y en ningún caso limitativas: <strong>NO SE AUTORIZA A LA LETRADA COBRO ALGUNO EN REPRESENTACIÓN DEL PODERDANTE.</strong></p>

    <p>Con lo que se dio por terminado el acto, previa lectura y ratificación de su contenido, firma el compareciente. <strong>ANTE MÍ QUE DOY FE.-</strong></p>

    <div class="firma-area">
      <div class="firma-box">Firma del Poderdante</div>
    </div>
  </div>
  </body></html>`);
  w.document.close();
  w.print();
}

export default function ContraparteModal({ client, open, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showActaModal, setShowActaModal] = useState(false);
  const [actaData, setActaData] = useState({ caratula: "", expediente: "", juzgado: "Juzgado de Familia N° 2" });
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
    // Pre-completar caratula con datos del cliente y contraparte
    const nombreCliente = client.client_type === "persona_juridica"
      ? client.razon_social || client.full_name
      : `${client.apellido || ""} ${client.nombre || ""}`.trim().toUpperCase();
    setActaData({
      caratula: `${nombreCliente} C/ ${contraparte.apellido.toUpperCase()} ${contraparte.nombre.toUpperCase()} S/ ___`,
      expediente: "",
      juzgado: "Juzgado de Familia N° 2",
      contraparte,
    });
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
      <Dialog open={showActaModal} onOpenChange={setShowActaModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <FileText className="w-5 h-5" /> Generar Acta Poder
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="p-3 rounded-lg bg-muted/40 border text-sm">
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
            <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ℹ️ El acta se genera con los datos del cliente cargado en el sistema. Revisá e imprimí para que el cliente firme.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActaModal(false)}>Cancelar</Button>
            <Button
              className="gap-2"
              onClick={() => { imprimirActaPoder(client, actaData.contraparte, actaData.caratula, actaData.expediente, actaData.juzgado); setShowActaModal(false); }}
              disabled={!actaData.caratula}
            >
              <FileText className="w-4 h-4" /> Generar e Imprimir Acta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}