import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Calendar, ArrowUpDown, Loader2, Eye, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

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

async function generarResumen(doc) {
  if (!doc.contenido_texto || doc.contenido_texto.trim().length < 30) return null;
  const resultado = await base44.integrations.Core.InvokeLLM({
    prompt: `Resumí en 2-3 oraciones breves y precisas el contenido de este documento jurídico. 
Indicá: qué tipo de acto o documento es, quiénes intervienen (si se mencionan) y cuál es su objeto o resolución principal.
Sé conciso y directo. No uses frases como "El documento..." o "Este texto...". Empezá directo con el contenido.

TEXTO:
${doc.contenido_texto.slice(0, 3000)}`,
  });
  return resultado || null;
}

export default function IndiceCaso({ documentos }) {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [sortBy, setSortBy] = useState("orden");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [resumenes, setResumenes] = useState({});
  const [generandoTodos, setGenerandoTodos] = useState(false);
  const [editando, setEditando] = useState({}); // { docId: { titulo, fecha_documento } }
  const queryClient = useQueryClient();

  const filtered = documentos
    .filter(d => {
      const matchSearch =
        d.titulo?.toLowerCase().includes(search.toLowerCase()) ||
        d.fuente?.toLowerCase().includes(search.toLowerCase()) ||
        resumenes[d.id]?.text?.toLowerCase().includes(search.toLowerCase());
      const matchTipo = tipoFilter === "all" || d.tipo_documento === tipoFilter;
      const matchDesde = !fechaDesde || (d.fecha_documento && d.fecha_documento >= fechaDesde);
      const matchHasta = !fechaHasta || (d.fecha_documento && d.fecha_documento <= fechaHasta);
      return matchSearch && matchTipo && matchDesde && matchHasta;
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

  useEffect(() => {
    documentos.forEach(doc => {
      if (doc.contenido_texto && doc.contenido_texto.trim().length >= 30) {
        setResumenes(prev => {
          if (prev[doc.id]) return prev;
          const next = { ...prev, [doc.id]: { loading: true, text: null } };
          generarResumen(doc).then(text => {
            setResumenes(p => ({ ...p, [doc.id]: { loading: false, text } }));
          });
          return next;
        });
      }
    });
  }, [documentos.map(d => d.id).join(",")]);

  const handleGenerarTodos = async () => {
    const sinResumen = documentos.filter(
      d => d.contenido_texto && d.contenido_texto.trim().length >= 30 && !resumenes[d.id]?.text
    );
    if (!sinResumen.length) return;
    setGenerandoTodos(true);
    for (const doc of sinResumen) {
      setResumenes(prev => ({ ...prev, [doc.id]: { loading: true, text: null } }));
      const text = await generarResumen(doc);
      setResumenes(prev => ({ ...prev, [doc.id]: { loading: false, text } }));
    }
    setGenerandoTodos(false);
  };

  const abrirEdicion = (doc) => {
    setEditando(prev => ({ ...prev, [doc.id]: { titulo: doc.titulo || "", fecha_documento: doc.fecha_documento || "" } }));
  };

  const cancelarEdicion = (docId) => {
    setEditando(prev => { const n = { ...prev }; delete n[docId]; return n; });
  };

  const guardarCambios = async (doc) => {
    const cambios = editando[doc.id];
    if (!cambios) return;
    const updates = {};
    if (cambios.titulo.trim() && cambios.titulo.trim() !== doc.titulo) updates.titulo = cambios.titulo.trim();
    if (cambios.fecha_documento !== doc.fecha_documento) updates.fecha_documento = cambios.fecha_documento || null;
    if (Object.keys(updates).length > 0) {
      await base44.entities.CasoDocumento.update(doc.id, updates);
      queryClient.invalidateQueries({ queryKey: ["caso_documentos", doc.caso_id] });
    }
    cancelarEdicion(doc.id);
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
      {/* Filtros principales */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, fuente, resumen..."
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

      {/* Filtro por rango de fechas */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/40 border">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" /> Filtrar por fecha:
        </span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="h-7 text-xs w-36" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="h-7 text-xs w-36" />
        </div>
        {(fechaDesde || fechaHasta) && (
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { setFechaDesde(""); setFechaHasta(""); }}>
            <X className="w-3 h-3" /> Limpiar
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          <strong>{filtered.length}</strong> de <strong>{documentos.length}</strong> documentos
        </p>
        {documentos.some(d => d.contenido_texto && !resumenes[d.id]?.text && !resumenes[d.id]?.loading) && (
          <Button size="sm" variant="outline" className="gap-2 text-xs h-7" onClick={handleGenerarTodos} disabled={generandoTodos}>
            {generandoTodos ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Generar resúmenes faltantes
          </Button>
        )}
      </div>

      {/* Tabla de índice */}
      <div className="border rounded-xl overflow-hidden divide-y">
        {filtered.map((doc, idx) => {
          const res = resumenes[doc.id];
          const edit = editando[doc.id];
          return (
            <div key={doc.id} className="px-4 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-muted-foreground w-6 shrink-0 mt-0.5">{idx + 1}</span>
                <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0 space-y-1">
                  {edit ? (
                    /* Modo edición */
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-muted-foreground w-12">Título:</label>
                          <Input
                            value={edit.titulo}
                            onChange={e => setEditando(prev => ({ ...prev, [doc.id]: { ...prev[doc.id], titulo: e.target.value } }))}
                            className="h-7 text-sm w-72"
                            autoFocus
                            onKeyDown={e => { if (e.key === "Enter") guardarCambios(doc); if (e.key === "Escape") cancelarEdicion(doc.id); }}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-muted-foreground w-12">Fecha:</label>
                          <Input
                            type="date"
                            value={edit.fecha_documento}
                            onChange={e => setEditando(prev => ({ ...prev, [doc.id]: { ...prev[doc.id], fecha_documento: e.target.value } }))}
                            className="h-7 text-xs w-36"
                          />
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600 gap-1 text-xs" onClick={() => guardarCambios(doc)}>
                          <Check className="w-3.5 h-3.5" /> Guardar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground text-xs" onClick={() => cancelarEdicion(doc.id)}>
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Modo visualización */
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 group/titulo">
                        <span className="font-semibold text-sm">{doc.titulo}</span>
                        <button
                          onClick={() => abrirEdicion(doc)}
                          className="opacity-0 group-hover/titulo:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                          title="Editar título y fecha"
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                      {doc.tipo_documento && (
                        <Badge className={`${tipoColors[doc.tipo_documento]} text-xs py-0`} variant="secondary">
                          {tipoLabels[doc.tipo_documento]}
                        </Badge>
                      )}
                      {doc.fecha_documento ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(doc.fecha_documento), "d 'de' MMMM yyyy", { locale: es })}
                        </span>
                      ) : (
                        <button
                          onClick={() => abrirEdicion(doc)}
                          className="flex items-center gap-1 text-xs text-muted-foreground/50 italic hover:text-muted-foreground transition-colors"
                        >
                          <Calendar className="w-3 h-3" /> Sin fecha — click para agregar
                        </button>
                      )}
                    </div>
                  )}

                  {/* Fuente */}
                  {doc.fuente && (
                    <p className="text-xs text-muted-foreground">Fuente: {doc.fuente}</p>
                  )}

                  {/* Resumen */}
                  {res?.loading ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Generando resumen...
                    </div>
                  ) : res?.text ? (
                    <p className="text-sm text-foreground/80 leading-relaxed mt-1">{res.text}</p>
                  ) : !doc.contenido_texto ? (
                    <p className="text-xs text-muted-foreground/60 italic mt-1">Sin texto transcripto — subí el archivo y transcribilo con IA</p>
                  ) : null}

                  {/* Notas */}
                  {doc.notas && (
                    <p className="text-xs text-muted-foreground italic">{doc.notas}</p>
                  )}
                </div>

                {/* Ver archivo */}
                {doc.file_url && (
                  <Button size="sm" variant="ghost" asChild className="shrink-0 mt-0.5">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                )}
              </div>
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