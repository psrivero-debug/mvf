import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, Briefcase, FileText, 
  MessageSquare, Scale, Menu, X, Shield, Calculator, ClipboardList, CheckSquare
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/", label: "Panel", icon: LayoutDashboard },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/causas", label: "Causas", icon: Briefcase },
  { path: "/documentos", label: "Documentos", icon: FileText },
  { path: "/ius", label: "Tabla IUS", icon: Calculator },
  { path: "/requisitos", label: "Requisitos", icon: CheckSquare },
  { path: "/redaccion", label: "Redacción IA", icon: MessageSquare },
  { path: "/consultas", label: "Consultas", icon: ClipboardList },
  { path: "/consulta", label: "Consulta Legal", icon: Scale },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-sidebar text-sidebar-foreground
        flex flex-col transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
            <h1 className="font-serif text-lg font-semibold text-white">Pérez & Funes</h1>
            <p className="text-xs text-sidebar-foreground/60">Estudio Jurídico · Negocios Inmobiliarios</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
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
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent">
            <p className="text-xs text-sidebar-foreground/60">Datos protegidos</p>
            <p className="text-xs text-sidebar-primary mt-0.5 font-medium">Información privada y confidencial</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
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
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}