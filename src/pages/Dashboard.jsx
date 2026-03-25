import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, FileText, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";

const StatCard = ({ title, value, icon: Icon, color, link }) => (
  <Link to={link}>
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-2 font-serif">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color} transition-transform group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground group-hover:text-primary transition-colors">
          Ver detalle <ArrowRight className="w-3 h-3" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

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

  const activeCases = cases.filter(c => c.status !== "cerrado");
  const urgentCases = cases.filter(c => c.priority === "urgente" && c.status !== "cerrado");
  
  const upcomingDeadlines = cases
    .filter(c => c.next_deadline && c.status !== "cerrado")
    .sort((a, b) => new Date(a.next_deadline) - new Date(b.next_deadline))
    .slice(0, 5);

  const recentCases = cases.slice(0, 5);

  const statusLabels = {
    activo: "Activo",
    en_tramite: "En trámite",
    sentencia: "Sentencia",
    apelacion: "Apelación",
    cerrado: "Cerrado"
  };

  const priorityColors = {
    baja: "bg-muted text-muted-foreground",
    media: "bg-blue-100 text-blue-700",
    alta: "bg-orange-100 text-orange-700",
    urgente: "bg-red-100 text-red-700"
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold">Panel de Control</h1>
        <p className="text-muted-foreground mt-1">Resumen general del estudio jurídico</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Clientes" value={clients.length} icon={Users} color="bg-primary/10 text-primary" link="/clientes" />
        <StatCard title="Causas Activas" value={activeCases.length} icon={Briefcase} color="bg-accent/20 text-accent-foreground" link="/causas" />
        <StatCard title="Documentos" value={documents.length} icon={FileText} color="bg-blue-50 text-blue-600" link="/documentos" />
        <StatCard title="Urgentes" value={urgentCases.length} icon={AlertTriangle} color="bg-red-50 text-red-600" link="/causas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Próximos Vencimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin vencimientos próximos</p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map(c => {
                  const isOverdue = isBefore(new Date(c.next_deadline), new Date());
                  const isSoon = isBefore(new Date(c.next_deadline), addDays(new Date(), 3));
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.client_name}</p>
                      </div>
                      <Badge variant="outline" className={
                        isOverdue ? "bg-red-50 text-red-600 border-red-200" :
                        isSoon ? "bg-orange-50 text-orange-600 border-orange-200" :
                        "bg-green-50 text-green-600 border-green-200"
                      }>
                        {format(new Date(c.next_deadline), "d MMM", { locale: es })}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Cases */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-accent" />
              Causas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentCases.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay causas registradas</p>
            ) : (
              <div className="space-y-3">
                {recentCases.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.case_type} · {c.client_name}</p>
                    </div>
                    <Badge className={priorityColors[c.priority] || "bg-muted"} variant="secondary">
                      {statusLabels[c.status] || c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}