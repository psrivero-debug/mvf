import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Briefcase, FileText, AlertTriangle, Clock,
  ArrowRight, Newspaper, ExternalLink, RefreshCw,
  CalendarDays, ChevronLeft, ChevronRight, User
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  format, isBefore, addDays, isSameDay,
  startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, getDay
} from "date-fns";
import { es } from "date-fns/locale";

// ── Stat Card ────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, link }) => (
  <Link to={link}>
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1 font-serif">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color} transition-transform group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-primary transition-colors">
          Ver detalle <ArrowRight className="w-3 h-3" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

// ── Mini Calendario ───────────────────────────────────────────────
function MiniCalendario({ eventos }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = (getDay(monthStart) + 6) % 7;
  const paddingDays = Array(startDow).fill(null);

  const eventosDelDia = (day) =>
    (eventos || []).filter(e => e.fecha && isSameDay(new Date(e.fecha + "T12:00:00"), day));

  const eventosSelected = eventosDelDia(selectedDay).sort((a, b) =>
    (a.hora_inicio || "").localeCompare(b.hora_inicio || "")
  );

  const tipoColor = {
    turno: "bg-blue-400",
    audiencia: "bg-red-400",
    cita: "bg-purple-400",
    disponibilidad: "bg-green-400",
  };

  return (
    <div className="space-y-3">
      {/* Navegación mes */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 rounded hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold capitalize">
          {format(currentDate, "MMMM yyyy", { locale: es })}
        </p>
        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 rounded hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Días semana */}
      <div className="grid grid-cols-7 text-center">
        {["L","M","X","J","V","S","D"].map(d => (
          <div key={d} className="text-[10px] font-bold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Grilla */}
      <div className="grid grid-cols-7 gap-0.5">
        {paddingDays.map((_, i) => <div key={`p-${i}`} />)}
        {days.map(day => {
          const evs = eventosDelDia(day);
          const isSelected = isSameDay(day, selectedDay);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={`relative flex flex-col items-center py-1 rounded-lg transition-colors text-xs
                ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-accent/30 font-bold" : "hover:bg-muted"}
              `}
            >
              <span>{format(day, "d")}</span>
              {evs.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {evs.slice(0, 3).map((e, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground" : (tipoColor[e.tipo] || "bg-muted-foreground")}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Eventos del día seleccionado */}
      <div className="border-t pt-3 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground capitalize">
          {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        {eventosSelected.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Sin eventos este día</p>
        ) : (
          eventosSelected.map(e => (
            <div key={e.id} className="flex items-center gap-2 text-xs py-1">
              <div className={`w-2 h-2 rounded-full shrink-0 ${tipoColor[e.tipo] || "bg-muted-foreground"}`} />
              <span className="text-muted-foreground">{e.hora_inicio}</span>
              <span className="truncate font-medium">{e.titulo || e.tipo}</span>
              {e.client_name && <span className="text-muted-foreground truncate">· {e.client_name}</span>}
            </div>
          ))
        )}
        <Link to="/calendario" className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
          Ver calendario completo <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// ── Noticias ──────────────────────────────────────────────────────
function PanelNoticias() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const [errorNoticias, setErrorNoticias] = useState(false);

  const fetchNoticias = async () => {
    setLoading(true);
    setErrorNoticias(false);
    try {
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un asistente jurídico especializado en derecho argentino, con foco en la provincia de San Luis.
      
Busca y devuelve las 6 noticias legales y novedades jurídicas más relevantes y recientes de Argentina, priorizando aquellas que afecten a San Luis o a la práctica del derecho en el interior del país. Incluye:
- Reformas legislativas o reglamentarias recientes
- Fallos o jurisprudencia destacada (Corte Suprema, Cámara Nacional, Tribunal Superior de San Luis)
- Novedades del Colegio de Abogados de San Luis (CAPSL)
- Actualizaciones en aranceles, IUS, o normativa provincial
- Noticias relevantes de portales jurídicos como Infojus, La Ley, Eldial, MicroJuris, Ambito Jurídico

Responde SOLO con el JSON, sin explicaciones ni texto adicional.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            noticias: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  resumen: { type: "string" },
                  fuente: { type: "string" },
                  categoria: { type: "string", enum: ["legislacion", "jurisprudencia", "provincial", "aranceles", "general"] },
                  fecha: { type: "string" }
                }
              }
            }
          }
        }
      });
      setNoticias(resultado?.noticias || []);
      setLastFetch(new Date());
    } catch (err) {
      setErrorNoticias(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoticias();
  }, []);

  const categoriaConfig = {
    legislacion:   { label: "Legislación",   color: "bg-blue-100 text-blue-800" },
    jurisprudencia:{ label: "Jurisprudencia", color: "bg-purple-100 text-purple-800" },
    provincial:    { label: "San Luis",       color: "bg-amber-100 text-amber-800" },
    aranceles:     { label: "Aranceles/IUS",  color: "bg-green-100 text-green-800" },
    general:       { label: "General",        color: "bg-muted text-muted-foreground" },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-base">Novedades Legales</h3>
        </div>
        <div className="flex items-center gap-2">
          {lastFetch && (
            <span className="text-[10px] text-muted-foreground">
              Actualizado: {format(lastFetch, "HH:mm")}
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={fetchNoticias}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse space-y-2 p-3 rounded-xl bg-muted/40">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-2 bg-muted rounded w-full" />
              <div className="h-2 bg-muted rounded w-2/3" />
            </div>
          ))}
          <p className="text-xs text-center text-muted-foreground mt-2">Buscando novedades jurídicas...</p>
        </div>
      ) : errorNoticias ? (
        <div className="text-center py-6 space-y-1">
          <p className="text-sm text-muted-foreground">No se pudieron cargar las novedades en este momento.</p>
          <p className="text-xs text-muted-foreground/70">Es posible que se haya alcanzado el límite mensual de integraciones.</p>
        </div>
      ) : noticias.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No se pudieron cargar las noticias</p>
      ) : (
        <div className="space-y-3">
          {noticias.map((n, i) => {
            const cfg = categoriaConfig[n.categoria] || categoriaConfig.general;
            return (
              <div key={i} className="p-3 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-2 mb-1.5">
                  <Badge className={`text-[10px] shrink-0 ${cfg.color}`}>{cfg.label}</Badge>
                  {n.fecha && <span className="text-[10px] text-muted-foreground mt-0.5">{n.fecha}</span>}
                </div>
                <p className="text-sm font-semibold leading-snug">{n.titulo}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.resumen}</p>
                {n.fuente && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1.5 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> {n.fuente}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────
export default function Dashboard() {
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.Case.list("-created_date", 50),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: () => base44.entities.Document.list("-created_date", 10),
  });

  const { data: eventos = [] } = useQuery({
    queryKey: ["eventos-dashboard"],
    queryFn: () => base44.entities.Evento.filter({}),
  });

  const activeCases = cases.filter(c => c.status !== "cerrado");
  const urgentCases = cases.filter(c => c.priority === "urgente" && c.status !== "cerrado");

  const upcomingDeadlines = cases
    .filter(c => c.next_deadline && c.status !== "cerrado")
    .sort((a, b) => new Date(a.next_deadline) - new Date(b.next_deadline))
    .slice(0, 5);

  const statusLabels = {
    activo: "Activo", en_tramite: "En trámite",
    sentencia: "Sentencia", apelacion: "Apelación", cerrado: "Cerrado"
  };

  const priorityColors = {
    baja: "bg-muted text-muted-foreground",
    media: "bg-blue-100 text-blue-700",
    alta: "bg-orange-100 text-orange-700",
    urgente: "bg-red-100 text-red-700"
  };

  // Próximos eventos (hoy y mañana)
  const eventosProximos = eventos
    .filter(e => {
      if (!e.fecha) return false;
      const d = new Date(e.fecha + "T12:00:00");
      const hoy = new Date();
      return d >= new Date(hoy.setHours(0,0,0,0)) && d <= addDays(new Date(), 7);
    })
    .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio))
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold">Panel de Control</h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Clientes" value={clients.length} icon={Users} color="bg-primary/10 text-primary" link="/clientes" />
        <StatCard title="Causas Activas" value={activeCases.length} icon={Briefcase} color="bg-accent/20 text-accent-foreground" link="/causas" />
        <StatCard title="Documentos" value={documents.length} icon={FileText} color="bg-blue-50 text-blue-600" link="/documentos" />
        <StatCard title="Urgentes" value={urgentCases.length} icon={AlertTriangle} color="bg-red-50 text-red-600" link="/causas" />
      </div>

      {/* Fila principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Noticias legales — 2 columnas */}
        <Card className="border-0 shadow-sm xl:col-span-2">
          <CardContent className="p-5">
            <PanelNoticias />
          </CardContent>
        </Card>

        {/* Columna derecha: calendario + próximos eventos */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-4 h-4 text-accent" />
                <h3 className="font-semibold text-base">Agenda</h3>
              </div>
              <MiniCalendario eventos={eventos} />
            </CardContent>
          </Card>

          {/* Próximos eventos semana */}
          {eventosProximos.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold text-sm">Próximos 7 días</h3>
                </div>
                <div className="space-y-2">
                  {eventosProximos.map(e => (
                    <div key={e.id} className="flex items-start gap-2 text-xs">
                      <div className="shrink-0 text-right w-10 text-muted-foreground mt-0.5">
                        <p>{e.fecha ? format(new Date(e.fecha + "T12:00:00"), "d MMM", { locale: es }) : ""}</p>
                        <p>{e.hora_inicio}</p>
                      </div>
                      <div className="flex-1 min-w-0 border-l pl-2">
                        <p className="font-medium truncate">{e.titulo || e.tipo}</p>
                        {e.client_name && <p className="text-muted-foreground truncate">{e.client_name}</p>}
                        {e.abogada_nombre && <p className="text-muted-foreground truncate flex items-center gap-1"><User className="w-2.5 h-2.5" />{e.abogada_nombre}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vencimientos */}
          {upcomingDeadlines.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold text-sm">Vencimientos</h3>
                </div>
                <div className="space-y-2">
                  {upcomingDeadlines.map(c => {
                    const isOverdue = isBefore(new Date(c.next_deadline), new Date());
                    const isSoon = isBefore(new Date(c.next_deadline), addDays(new Date(), 3));
                    return (
                      <div key={c.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{c.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{c.client_name}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${
                          isOverdue ? "bg-red-50 text-red-600 border-red-200" :
                          isSoon ? "bg-orange-50 text-orange-600 border-orange-200" :
                          "bg-green-50 text-green-600 border-green-200"
                        }`}>
                          {format(new Date(c.next_deadline), "d MMM", { locale: es })}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}