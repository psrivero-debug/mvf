import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import { Sparkles, ArrowLeft, Scale, Calculator, Briefcase, Landmark, Home, Heart, Plus, FolderOpen, Trash2, Loader2, FolderInput } from "lucide-react";
import ProyectoVista from "@/components/consultores/ProyectoVista";

const CONSULTORES = [
  {
    id: "juridico",
    nombre: "Consultor Jurídico",
    descripcion: "Asesoramiento legal general: civil, comercial, administrativo y daños.",
    icon: Scale,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    prompt: "Sos un consultor jurídico experto del estudio Pérez & Funes (San Luis, Argentina). Respondé con claridad y fundamento normativo, citando leyes y jurisprudencia argentina aplicable cuando corresponda. Aclará siempre que es orientación preliminar y no reemplaza el patrocinio formal.",
  },
  {
    id: "financiero",
    nombre: "Consultor Financiero / Contable",
    descripcion: "Impuestos, monotributo, facturación, honorarios y gestión financiera del estudio.",
    icon: Calculator,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    prompt: "Sos un consultor financiero y contable especializado en estudios jurídicos de Argentina. Orientás sobre monotributo, IVA, facturación AFIP, honorarios profesionales (aranceles IUS), gestión de caja y presupuestos. Respondé con criterio práctico y normativa argentina vigente.",
  },
  {
    id: "laboral",
    nombre: "Consultor Laboral",
    descripcion: "Despidos, accidentes de trabajo, indemnizaciones y relaciones laborales.",
    icon: Briefcase,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    prompt: "Sos un consultor especialista en derecho laboral argentino (LCT, ART, ley de contratos de trabajo). Orientás sobre despidos, indemnizaciones, accidentes de trabajo, suspensiones y procedimientos. Cité la normativa y calculá montos estimativos cuando se aporten datos.",
  },
  {
    id: "previsional",
    nombre: "Consultor Previsional",
    descripcion: "Jubilaciones, pensiones, ANSES y trámites previsionales.",
    icon: Landmark,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    prompt: "Sos un consultor previsional experto en el sistema argentino (ANSES, ley 24.241 y modificatorias). Orientás sobre jubilaciones, pensiones por invalidez y por fallecimiento, moratorias, requisitos de edad y aportes, y trámites. Aclará que las estimaciones son orientativas.",
  },
  {
    id: "inmobiliario",
    nombre: "Consultor Inmobiliario",
    descripcion: "Alquileres, compraventa, escrituras y disputas sobre inmuebles.",
    icon: Home,
    color: "text-cyan-600 bg-cyan-50 border-cyan-200",
    prompt: "Sos un consultor en derecho inmobiliario argentino. Orientás sobre contratos de alquiler (ley 27.551), compraventa, escrituración, desalojos, usucapión y disputas sobre inmuebles. Cité la normativa aplicable y advertí riesgos.",
  },
  {
    id: "familia",
    nombre: "Consultor de Familia",
    descripcion: "Divorcios, cuota alimentaria, tenencia, régimen de visitas y sucesiones.",
    icon: Heart,
    color: "text-rose-600 bg-rose-50 border-rose-200",
    prompt: "Sos un consultor en derecho de familia y sucesiones argentino. Orientás sobre divorcios (ley 26.999), cuota alimentaria, tenencia, régimen de comunicación, adopción y sucesiones. Tratá los temas con sensibilidad y fundamento normativo.",
  },
];

export default function Consultores() {
  const [activo, setActivo] = useState(null);
  const [proyectoAbierto, setProyectoAbierto] = useState(null);
  const [dialogNuevo, setDialogNuevo] = useState(false);
  const [formNuevo, setFormNuevo] = useState({ titulo: "", descripcion: "" });
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(null);
  const queryClient = useQueryClient();

  const { data: proyectos = [], isLoading } = useQuery({
    queryKey: ["proyectos_consultoria", activo?.id],
    queryFn: () => base44.entities.ProyectoConsultoria.filter({ consultor_id: activo.id }, "-created_date", 50),
    enabled: !!activo && !proyectoAbierto,
  });

  const crearMutation = useMutation({
    mutationFn: (data) => base44.entities.ProyectoConsultoria.create(data),
    onSuccess: (rec) => {
      queryClient.invalidateQueries({ queryKey: ["proyectos_consultoria", activo?.id] });
      setDialogNuevo(false);
      setFormNuevo({ titulo: "", descripcion: "" });
      setProyectoAbierto(rec);
    },
    onError: () => toast({ title: "Error", description: "No se pudo crear el proyecto.", variant: "destructive" }),
  });

  const borrarMutation = useMutation({
    mutationFn: (id) => base44.entities.ProyectoConsultoria.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proyectos_consultoria", activo?.id] });
      setConfirmandoBorrar(null);
    },
  });

  const crearProyecto = () => {
    if (!formNuevo.titulo.trim()) return;
    crearMutation.mutate({ consultor_id: activo.id, titulo: formNuevo.titulo.trim(), descripcion: formNuevo.descripcion.trim() });
  };

  // Vista del proyecto abierto
  if (activo && proyectoAbierto) {
    return (
      <ProyectoVista
        consultor={activo}
        proyecto={proyectoAbierto}
        onVolver={() => { setProyectoAbierto(null); queryClient.invalidateQueries({ queryKey: ["proyectos_consultoria", activo.id] }); }}
      />
    );
  }

  // Vista de proyectos del consultor
  if (activo) {
    const Icon = activo.icon;
    return (
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setActivo(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${activo.color} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-serif font-semibold">{activo.nombre}</h1>
            <p className="text-sm text-muted-foreground">{activo.descripcion}</p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setDialogNuevo(true)}>
            <Plus className="w-4 h-4" /> Nuevo proyecto
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : proyectos.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Todavía no hay proyectos con este consultor.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Creá un proyecto para cargar documentos y guardar los análisis.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {proyectos.map((p) => (
              <Card key={p.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setProyectoAbierto(p)}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-border bg-muted/30 shrink-0">
                      <FolderInput className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate group-hover:text-accent transition-colors">{p.titulo}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-[10px]">{p.estado === "cerrado" ? "Cerrado" : "Activo"}</Badge>
                    </div>
                    {confirmandoBorrar === p.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive border border-destructive/30" onClick={() => borrarMutation.mutate(p.id)}>
                          Confirmar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-1" onClick={() => setConfirmandoBorrar(null)}>
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm" variant="ghost"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={(e) => { e.stopPropagation(); setConfirmandoBorrar(p.id); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {p.descripcion && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.descripcion}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogNuevo} onOpenChange={setDialogNuevo}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo proyecto</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Título *</Label>
                <Input
                  autoFocus
                  placeholder="Ej: Despido de Juan Pérez"
                  value={formNuevo.titulo}
                  onChange={(e) => setFormNuevo({ ...formNuevo, titulo: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") crearProyecto(); }}
                />
              </div>
              <div className="grid gap-2">
                <Label>Descripción del caso</Label>
                <Textarea
                  placeholder="Contá brevemente el caso a tratar..."
                  value={formNuevo.descripcion}
                  onChange={(e) => setFormNuevo({ ...formNuevo, descripcion: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogNuevo(false)}>Cancelar</Button>
              <Button onClick={crearProyecto} disabled={!formNuevo.titulo.trim() || crearMutation.isPending}>
                {crearMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Crear proyecto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Vista de selección de consultor
  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" />
          Consultores IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Elegí el especialista según tu interés. Dentro de cada consultor podés crear proyectos, cargar documentos (imágenes o textos) y guardar los análisis obtenidos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONSULTORES.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => { setActivo(c); setProyectoAbierto(null); }}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${c.color} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base group-hover:text-accent transition-colors">{c.nombre}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-[10px]">IA</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.descripcion}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}