import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Clock,
  User, Briefcase, CheckCircle2, Trash2, Edit2, UserCheck
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, getDay } from "date-fns";
import { es } from "date-fns/locale";
import EventoModal from "@/components/calendario/EventoModal";
import AsignarTurnoModal from "@/components/calendario/AsignarTurnoModal";

const tipoConfig = {
  turno:         { label: "Turno",      color: "bg-blue-500",   light: "bg-blue-100 text-blue-800 border-blue-200" },
  audiencia:     { label: "Audiencia",  color: "bg-red-500",    light: "bg-red-100 text-red-800 border-red-200" },
  cita:          { label: "Cita",       color: "bg-purple-500", light: "bg-purple-100 text-purple-800 border-purple-200" },
  disponibilidad:{ label: "Disponible", color: "bg-green-500",  light: "bg-green-100 text-green-800 border-green-200" },
};

const ABOGADA_COLORS = [
  "border-l-blue-400",
  "border-l-amber-400",
  "border-l-rose-400",
  "border-l-teal-400",
];

export default function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [asignarEvento, setAsignarEvento] = useState(null);
  const [filtroAbogada, setFiltroAbogada] = useState("todas");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isSecretaria = user?.role === "user"; // secretaria = rol user
  const isAbogada = user?.role === "admin" || user?.role === "abogada";

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users-abogadas"],
    queryFn: () => base44.entities.User.list(),
  });

  // Abogadas = admins
  const abogadas = allUsers.filter(u => u.role === "admin");

  const { data: eventos = [] } = useQuery({
    queryKey: ["eventos", format(currentDate, "yyyy-MM")],
    queryFn: () => base44.entities.Evento.filter({}),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Evento.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventos"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Evento.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Evento.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventos"] }),
  });

  const handleSaveEvento = (data) => {
    if (editingEvento) {
      updateMutation.mutate({ id: editingEvento.id, data });
    } else {
      createMutation.mutate({ ...data, asignado_por: user?.email });
    }
    setShowModal(false);
    setEditingEvento(null);
  };

  const handleAsignar = (evento, asignData) => {
    updateMutation.mutate({
      id: evento.id,
      data: { ...evento, ...asignData, asignado_por: user?.email },
    });
    setAsignarEvento(null);
  };

  // Días del mes
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Relleno de días previos (semana empieza lunes)
  const startDow = (getDay(monthStart) + 6) % 7; // lunes = 0
  const paddingDays = Array(startDow).fill(null);

  // Filtrar eventos
  const eventosFiltrados = eventos.filter(e => {
    if (filtroAbogada !== "todas" && e.abogada_email !== filtroAbogada) return false;
    return true;
  });

  const eventosDelDia = (day) =>
    eventosFiltrados.filter(e => e.fecha && isSameDay(new Date(e.fecha + "T12:00:00"), day));

  const eventosSelected = eventosDelDia(selectedDay).sort((a, b) =>
    (a.hora_inicio || "").localeCompare(b.hora_inicio || "")
  );

  // Color por abogada
  const abogadaColorMap = {};
  abogadas.forEach((a, i) => { abogadaColorMap[a.email] = ABOGADA_COLORS[i % ABOGADA_COLORS.length]; });

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── SIDEBAR IZQUIERDO: mini calendar + abogadas ── */}
      <div className="w-72 shrink-0 border-r bg-card flex flex-col overflow-y-auto hidden lg:flex">
        <div className="p-5 border-b">
          <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Calendario
          </h2>

          {/* Filtro abogada */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ver agenda de</p>
            <Select value={filtroAbogada} onValueChange={setFiltroAbogada}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las abogadas</SelectItem>
                {abogadas.map(a => (
                  <SelectItem key={a.id} value={a.email}>{a.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Leyenda */}
        <div className="p-5 border-b space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Tipo de evento</p>
          {Object.entries(tipoConfig).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-sm">
              <div className={`w-2.5 h-2.5 rounded-full ${v.color}`} />
              <span className="text-muted-foreground">{v.label}</span>
            </div>
          ))}
        </div>

        {/* Abogadas */}
        {abogadas.length > 0 && (
          <div className="p-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Abogadas</p>
            {abogadas.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full border-2 ${ABOGADA_COLORS[i % ABOGADA_COLORS.length].replace("border-l-", "border-")}`} />
                <span>{a.full_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PANEL CENTRAL: calendario mensual ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold capitalize min-w-[180px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="ml-2 text-xs" onClick={() => setCurrentDate(new Date())}>
              Hoy
            </Button>
          </div>

          <Button
            size="sm"
            className="gap-2"
            onClick={() => { setEditingEvento(null); setShowModal(true); }}
          >
            <Plus className="w-4 h-4" /> Nuevo evento
          </Button>
        </div>

        {/* Grilla */}
        <div className="flex-1 overflow-auto p-4">
          {/* Días semana */}
          <div className="grid grid-cols-7 mb-2">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const evs = eventosDelDia(day);
              const isSelected = isSameDay(day, selectedDay);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[80px] rounded-xl p-1.5 cursor-pointer border transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary/40"
                      : "border-transparent hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${
                    isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                  }`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {evs.slice(0, 3).map(e => (
                      <div
                        key={e.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${tipoConfig[e.tipo]?.light || "bg-muted text-muted-foreground"}`}
                      >
                        {e.hora_inicio} {e.titulo || tipoConfig[e.tipo]?.label}
                      </div>
                    ))}
                    {evs.length > 3 && (
                      <p className="text-[10px] text-muted-foreground pl-1">+{evs.length - 3} más</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO: detalle del día ── */}
      <div className="w-80 shrink-0 border-l bg-card flex flex-col overflow-hidden hidden xl:flex">
        <div className="px-5 py-4 border-b">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agenda del día</p>
          <p className="font-serif text-lg font-bold capitalize mt-0.5">
            {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {eventosSelected.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Calendar className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Sin eventos este día</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5 text-xs"
                onClick={() => { setEditingEvento(null); setShowModal(true); }}
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </Button>
            </div>
          ) : (
            eventosSelected.map(e => {
              const cfg = tipoConfig[e.tipo] || tipoConfig.turno;
              const colorBorder = abogadaColorMap[e.abogada_email] || "border-l-gray-300";
              const isDisponible = e.tipo === "disponibilidad";
              return (
                <div
                  key={e.id}
                  className={`rounded-xl border border-l-4 ${colorBorder} bg-background p-3 space-y-1.5`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className={`text-[10px] ${cfg.light}`}>{cfg.label}</Badge>
                        {isDisponible && (
                          <Badge className="text-[10px] bg-green-100 text-green-700">Libre</Badge>
                        )}
                      </div>
                      <p className="font-semibold text-sm mt-1">
                        {e.titulo || (isDisponible ? "Horario disponible" : cfg.label)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />{e.hora_inicio}{e.hora_fin ? ` – ${e.hora_fin}` : ""}
                      </p>
                      {e.abogada_nombre && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />{e.abogada_nombre}
                        </p>
                      )}
                      {e.client_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />{e.client_name}
                        </p>
                      )}
                      {e.juzgado && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />{e.juzgado}
                        </p>
                      )}
                      {e.descripcion && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{e.descripcion}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 pt-1 border-t">
                    {/* Secretaria puede asignar turnos disponibles */}
                    {isSecretaria && isDisponible && (
                      <Button size="sm" className="gap-1 text-[11px] h-6 px-2 bg-green-600 hover:bg-green-700" onClick={() => setAsignarEvento(e)}>
                        <CheckCircle2 className="w-3 h-3" /> Asignar
                      </Button>
                    )}
                    {/* Abogada puede editar sus propios eventos; secretaria puede editar cualquiera */}
                    {(isSecretaria || e.abogada_email === user?.email) && (
                      <>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => { setEditingEvento(e); setShowModal(true); }}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-destructive text-[11px]" onClick={() => deleteMutation.mutate(e.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modales */}
      <EventoModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingEvento(null); }}
        onSave={handleSaveEvento}
        evento={editingEvento}
        fechaInicial={format(selectedDay, "yyyy-MM-dd")}
        abogadaEmail={user?.email}
        abogadaNombre={user?.full_name}
        isSecretaria={isSecretaria}
        abogadas={abogadas}
      />

      <AsignarTurnoModal
        open={!!asignarEvento}
        onClose={() => setAsignarEvento(null)}
        evento={asignarEvento}
        onAsignar={handleAsignar}
      />
    </div>
  );
}