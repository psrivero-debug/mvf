import { useState } from "react";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import LeerCompleto from "./LeerCompleto";

export default function VersionesDocumento({ doc }) {
  const [abierto, setAbierto] = useState(false);
  const versiones = doc.versiones || [];
  if (!versiones.length) return null;

  return (
    <div className="mt-1">
      <button
        onClick={() => setAbierto(a => !a)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <History className="w-3 h-3" />
        {versiones.length} versión{versiones.length !== 1 ? "es" : ""} anterior{versiones.length !== 1 ? "es" : ""}
        {abierto ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {abierto && (
        <div className="mt-2 space-y-3 border-l-2 border-border pl-3">
          {versiones.map((v, i) => (
            <div key={i} className="text-xs">
              <p className="text-muted-foreground">
                Versión {versiones.length - i} · guardada {v.fecha ? format(new Date(v.fecha), "d MMM yyyy HH:mm", { locale: es }) : "—"}
              </p>
              {v.resumen && (
                <p className="text-foreground/70 mt-1" dangerouslySetInnerHTML={{ __html: v.resumen }} />
              )}
              {v.contenido_texto && <LeerCompleto contenido_texto={v.contenido_texto} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}