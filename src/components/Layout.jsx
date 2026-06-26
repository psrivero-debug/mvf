import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Briefcase, FileText,
  MessageSquare, Scale, Menu, Shield, Calculator,
  ClipboardList, CheckCircle2, BookMarked, Receipt,
  FilePlus, ScanSearch, Archive, ChevronDown, ChevronRight,
  FolderOpen, Sparkles, CalendarDays, Megaphone, Gavel, RefreshCw, FileSpreadsheet, Wand2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const topItems = [
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/calendario", label: "Calendario", icon: CalendarDays },
];

const groups = [
  {
    id: "expedientes",
    label: "Expedientes",
    icon: FolderOpen,
    items: [
      { path: "/legajos", label: "Legajos", icon: Archive },
      { path: "/causas", label: "Causas", icon: Briefcase },
      { path: "/documentos", label: "Documentos", icon: FileText },
      { path: "/estudio-caso", label: "Estudio de Caso", icon: BookMarked },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    icon: Calculator,
    items: [
      { path: "/ius", label: "Tabla IUS", icon: Calculator },
      { path: "/requisitos", label: "Requisitos", icon: CheckCircle2 },
      { path: "/consultas", label: "Consultas", icon: ClipboardList },
      { path: "/presupuestos", label: "Presupuestos", icon: FilePlus },
      { path: "/recibos", label: "Recibos", icon: Receipt },
      { path: "/facturacion", label: "Facturación", icon: FileSpreadsheet },
    ],
  },
  {
    id: "herramientas",
    label: "Herramientas",
    icon: Sparkles,
    items: [
      { path: "/herramientas-especiales", label: "Herramientas Especiales", icon: Wand2 },
      { path: "/escritor-judicial", label: "Escritor Judicial IA", icon: FileText },
      { path: "/redaccion", label: "Redacción IA", icon: MessageSquare },
      { path: "/interpretar", label: "Interpretar Documento", icon: ScanSearch },
      { path: "/consulta", label: "Consulta Legal", icon: Scale },
      { path: "/publicidad", label: "Publicidad", icon: Megaphone },
      { path: "/concurso-quiebra", label: "Concurso y Quiebra", icon: Gavel },
    ],
  },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Determine which group is active based on current path
  const activeGroupId = groups.find(g => g.items.some(i => i.path === location.pathname))?.id;
  const [openGroups, setOpenGroups] = useState(() => activeGroupId ? [activeGroupId] : []);

  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  useEffect(() => {
    const handler = () => setShowFallbackBanner(true);
    window.addEventListener("llm-fallback", handler);
    return () => window.removeEventListener("llm-fallback", handler);
  }, []);

  const toggleGroup = (id) => {
    setOpenGroups(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const isGroupOpen = (id) => openGroups.includes(id);

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-sidebar text-sidebar-foreground
        flex flex-col transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/69c424df37de29e9326cbefa/acd4af465_image.png"
              alt="Pérez & Funes"
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
            <div>
              <h1 className="font-serif text-base font-semibold text-white leading-tight">Pérez & Funes</h1>
              <p className="text-xs text-sidebar-foreground/60">Estudio de Abogados</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Top-level items */}
          {topItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20'
                    : 'text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent'}
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}

          {/* Grouped sections */}
          <div className="pt-2 space-y-1">
            {groups.map(({ id, label, icon: GroupIcon, items }) => {
              const open = isGroupOpen(id);
              const hasActive = items.some(i => i.path === location.pathname);
              return (
                <div key={id}>
                  <button
                    onClick={() => toggleGroup(id)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold
                      transition-all duration-200
                      ${hasActive
                        ? 'text-sidebar-primary bg-sidebar-accent'
                        : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <GroupIcon className="w-4 h-4" />
                      <span className="uppercase tracking-wide text-xs">{label}</span>
                    </div>
                    {open
                      ? <ChevronDown className="w-3.5 h-3.5" />
                      : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>

                  {open && (
                    <div className="mt-1 ml-3 pl-3 border-l border-sidebar-border space-y-0.5">
                      {items.map(({ path, label: itemLabel, icon: Icon }) => {
                        const isActive = location.pathname === path;
                        return (
                          <Link
                            key={path}
                            to={path}
                            onClick={() => setMobileOpen(false)}
                            className={`
                              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                              transition-all duration-200
                              ${isActive
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20'
                                : 'text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent'}
                            `}
                          >
                            <Icon className="w-4 h-4" />
                            {itemLabel}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent">
            <p className="text-xs text-sidebar-foreground/60">Datos protegidos</p>
            <p className="text-xs text-sidebar-primary mt-0.5 font-medium">Información privada y confidencial</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 lg:px-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="gap-2 mr-3"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>
        {showFallbackBanner && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Integraciones agotadas — usando IA complementaria (Gemini) con las mismas indicaciones.
            </span>
            <button onClick={() => setShowFallbackBanner(false)} className="text-amber-600 hover:text-amber-900 font-bold text-sm leading-none">×</button>
          </div>
        )}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}