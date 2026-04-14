import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Calendar, ArrowUpDown, ChevronDown, ChevronRight, Loader2, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

const tipoLabels = {
  escrito: "Escrito", sentencia: "Sentencia", pericia: "Pericia",
  testimonio: "Testimonio", contrato: "Contrato", imagen: "Imagen", pdf: "PDF", otro: "Otro",
};

const tipoColors = {
  escrito: "bg-blue-100 text-blue-700", sentencia: "bg-purple-100 text-purple-700",
  pericia: "bg-orange-100 text-orange-700", testimonio: "bg-green-100 text-green-700",
  contrato: "bg-yellow-100 text-yellow-700", imagen: "bg-pink-100 text-pink-700",
  pdf: "bg-red-100 text-red-700", otro: "bg-gray-100 text-gray-600",
};

export default function IndiceCaso({ documentos }) {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [sortBy, setSortBy] = useState("orden");
  const [expandedId, setExpandedId] = useState(null);
  // secciones[docId] = { loading: bool, items: string[] }
  const [secciones, setSecciones] = useState({});

  const filtered = documentos
    .filter(d => {
      const matchSearch =
        d.titulo?.toLowerCase().includes(search.toLowerCase()) ||
        d.fuente?.toLowerCase().includes(search.toLowerCase()) ||
        d.notas?.toLowerCase().includes(search.toLowerCase()) ||
        (secciones[d.id]?.items || []).some(s => s.toLowerCase().includes(search.toLowerCase()));
      const matchTipo = tipoFilter === "all" || d.tipo_documento === tipoFilter;
      return matchSearch && matchTipo;
    })
    .sort((a, b) => {
      if (sortBy === "fecha") {
        if (!a.fecha_documento) return 1;
        if (!b.fecha_documento) return -1;
        return new Date(a.fecha_documento) - new Date(b.fecha_documento);
      }
      if (sortBy === "fecha_desc") {
        if (!a.fecha_documento) return 1;
        if (!b.fecha_documento) return -1;
        return new Date(b.fecha_documento) - new Date(a.fecha_documento);
      }
      if (sortBy === "titulo") return a.titulo?.localeCompare(b.titulo);
      return (a.orden ?? 0) - (b.orden ?? 0);
    });

  const toggleExpand = async (doc) => {
    const docId = doc.id;
    if (expandedId === docId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(docId);

    // Si ya tenemos secciones, no volver a cargar
    if (secciones[docId]) return;

    // Si no hay texto, no hay nada que extraer
    if (!doc.contenido_texto || doc.contenido_texto.trim().length < 50) {
      setSecciones(prev => ({ ...prev, [docId]: { loading: false, items: [] } }));
      return;
    }

    setSecciones(prev => ({ ...prev, [docId]: { loading: true, items: [] } }));

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: `Analizá el siguiente texto de un documento jurídico y extraé una lista de los títulos, secciones o apartados principales que aparecen en él.
Devolvé ÚNICAMENTE los nombres/títulos de las secciones, uno por línea, sin numeración ni bullets. 
Si el texto no tiene secciones claras, extraé las frases clave o los temas principales que se tratan (máximo 8).
No incluyas explicaciones, solo los títulos/secciones.

TEXTO DEL DOCUMENTO:
${doc.contenido_texto.slice(0, 3000)}`,
      response_json_schema: {
        type: "object",
        properties: {
          secciones: { type: "array", items: { type: "string" } }
        }
      }
    });

    const items = resultado?.secciones || [];
    setSecciones(prev => ({ ...prev, [docId]: { loading: false, items } }));
  };

  if (documentos.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-xl">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">No hay documentos en este caso</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Agregá documentos en la pestaña Documentos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, fuente, secciones..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Tipo de documento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(tipoLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44 h-9">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="orden">Orden del caso</SelectItem>
            <SelectItem value="titulo">Título A-Z</SelectItem>
            <SelectItem value="fecha">Fecha (más antiguo)</SelectItem>
            <SelectItem value="fecha_desc">Fecha (más reciente)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando <strong>{filtered.length}</strong> de <strong>{documentos.length}</strong> documentos · Hacé clic en una fila para ver sus secciones internas
      </p>

      {/* Lista expandible */}
      <div className="border rounded-xl overflow-hidden divide-y">
        {filtered.map((doc, idx) => {
          const isExpanded = expandedId === doc.id;
          const sec = secciones[doc.id];
          return (
            <div key={doc.id}>
              {/* Fila principal */}
              <button
                onClick={() => toggleExpand(doc)}
                className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-center gap-3"
              >
                <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">{idx + 1}</span>
                {isExpanded
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{doc.titulo}</span>
                    {doc.tipo_documento && (
                      <Badge className={`${tipoColors[doc.tipo_documento]} text-xs py-0`} variant="secondary">
                        {tipoLabels[doc.tipo_documento]}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-muted-foreground">
                    {doc.fuente && <span>{doc.fuente}</span>}
                    {doc.fecha_documento && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(doc.fecha_documento), "d MMM yyyy", { locale: es })}
                      </span>
                    )}
                  </div>
                </div>
                {doc.contenido_texto && (
                  <span className="text-xs text-primary hidden sm:inline shrink-0">Ver secciones</span>
                )}
              </button>

              {/* Secciones expandidas */}
              {isExpanded && (
                <div className="px-14 py-3 bg-muted/20 border-t">
                  {sec?.loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Extrayendo secciones con IA...
                    </div>
                  ) : sec?.items?.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Secciones / Temas del documento
                      </p>
                      <ul className="space-y-1">
                        {sec.items.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary font-medium shrink-0 mt-0.5">·</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : doc.contenido_texto ? (
                    <p className="text-xs text-muted-foreground py-1">No se encontraron secciones claras en este documento.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground py-1">Este documento no tiene texto. Transcribilo con IA para habilitar esta función.</p>
                  )}
                  {doc.notas && (
                    <p className="text-xs text-muted-foreground italic mt-2 border-t pt-2">Nota: {doc.notas}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No hay documentos que coincidan con la búsqueda
          </div>
        )}
      </div>
    </div>
  );
}