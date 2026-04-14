import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Calendar, ArrowUpDown, Loader2, Eye, Pencil, Check, X, ScanText, Sparkles, RefreshCw } from "lucide-react";
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

const PROMPT_TRANSCRIPCION = `Sos un transcriptor experto en documentos jurídicos argentinos escaneados.
Tu tarea es transcribir el contenido de esta imagen con la máxima fidelidad posible.

INSTRUCCIONES ESTRICTAS:
- Transcribí CADA PALABRA visible, incluyendo encabezados, sellos, firmas (indicalas como "[FIRMA]"), foliatura, numeraciones y fechas.
- Mantené la estructura original: párrafos, sangrías, listas numeradas, bullet points.
- Si hay texto manuscrito, transcribilo entre [MANUSCRITO: ...].
- Si hay sellos o membretes, transcribilos entre [SELLO: ...].
- Respetá mayúsculas, puntuación y acentos tal como aparecen.
- NO resumas, NO omitas nada. Transcribí TODO el texto visible de principio a fin.
- Al final, en una línea separada, escribí: TÍTULO SUGERIDO: [un título descriptivo conciso del documento, máximo 8 palabras].
- Al final, en otra línea separada, escribí: FECHA SUGERIDA: [la fecha principal del documento en formato YYYY-MM-DD, o null si no hay].

Devolvé ÚNICAMENTE la transcripción completa (con título y fecha al final), sin comentarios ni aclaraciones previas.`;

async function digitalizarDocumento(doc) {
  if (!doc.file_url) return null;
  const resultado = await base44.integrations.Core.InvokeLLM({
    prompt: PROMPT_TRANSCRIPCION,
    file_urls: [doc.file_url],
    model: "claude_sonnet_4_6",
  });

  const lines = resultado.split("\n");
  const tituloLine = lines.findLast(l => l.trim().startsWith("TÍTULO SUGERIDO:"));
  const fechaLine = lines.findLast(l => l.trim().startsWith("FECHA SUGERIDA:"));

  const titulo = tituloLine ? tituloLine.replace("TÍTULO SUGERIDO:", "").trim() : null;
  const fechaRaw = fechaLine ? fechaLine.replace("FECHA SUGERIDA:", "").trim() : null;
  const fecha = fechaRaw && /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw) ? fechaRaw : null;
  const contenido = lines
    .filter(l => !l.trim().startsWith("TÍTULO SUGERIDO:") && !l.trim().startsWith("FECHA SUGERIDA:"))
    .join("\n").trim();

  return { contenido, titulo, fecha };
}

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

async function extraerFecha(doc) {
  if (!doc.contenido_texto || doc.contenido_texto.trim().length < 10) return null;
  const resultado = await base44.integrations.Core.InvokeLLM({
    prompt: `Del siguiente texto de un documento jurídico argentino, extraé la fecha principal del documento (la fecha en que fue emitido, firmado o fechado).
Devolvé ÚNICAMENTE la fecha en formato YYYY-MM-DD. Si no encontrás ninguna fecha, devolvé la palabra null.
No agregues ningún otro texto ni explicación.

TEXTO:
${doc.contenido_texto.slice(0, 2000)}`,
  });
  const fecha = resultado?.trim();
  if (!fecha || fecha === "null" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  return fecha;
}

export default function IndiceCaso({ documentos }) {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [sortBy, setSortBy] = useState("orden");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [resumenes, setResumenes] = useState({});
  const [generandoTodos, setGenerandoTodos] = useState(false);
  const [editando, setEditando] = useState({});
  const [extrayendoFecha, setExtrayendoFecha] = useState({});
  const [digitalizando, setDigitalizando] = useState({});
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

  const handleDigitalizar = async (doc) => {
    if (!doc.file_url) return;
    setDigitalizando(prev => ({ ...prev, [doc.id]: true }));
    const resultado = await digitalizarDocumento(doc);
    if (resultado) {
      const updates = { contenido_texto: resultado.contenido };
      if (resultado.titulo && !doc.titulo) updates.titulo = resultado.titulo;
      if (resultado.fecha && !doc.fecha_documento) updates.fecha_documento = resultado.fecha;
      await base44.entities.CasoDocumento.update(doc.id, updates);
      queryClient.invalidateQueries({ queryKey: ["caso_documentos", doc.caso_id] });
      // Generar resumen inmediatamente con el texto nuevo
      const docActualizado = { ...doc, ...updates };
      const text = await generarResumen(docActualizado);
      if (text) setResumenes(prev => ({ ...prev, [doc.id]: { loading: false, text } }));
    }
    setDigitalizando(prev => ({ ...prev, [doc.id]: false }));
  };

  const handleDigitalizarTodos = async () => {
    const sinTexto = documentos.filter(d => !d.contenido_texto && d.file_url);
    if (!sinTexto.length) return;
    setGenerandoTodos(true);
    for (const doc of sinTexto) {
      await handleDigitalizar(doc);
    }
    setGenerandoTodos(false);
  };

  const abrirEdicion = (doc) => {
    setEditando(prev => ({ ...prev, [doc.id]: { titulo: doc.titulo || "", fecha_documento: doc.fecha_documento || "" } }));
  };

  const handleExtraerFecha = async (doc) => {
    if (!doc.contenido_texto) return;
    setExtrayendoFecha(prev => ({ ...prev, [doc.id]: true }));
    const fecha = await extraerFecha(doc);
    if (fecha) {
      await base44.entities.CasoDocumento.update(doc.id, { fecha_documento: fecha });
      queryClient.invalidateQueries({ queryKey: ["caso_documentos", doc.caso_id] });
    }
    setExtrayendoFecha(prev => ({ ...prev, [doc.id]: false }));
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

  const sinTexto = documentos.filter(d => !d.contenido_texto && d.file_url);

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

      {/* Banner: documentos sin digitalizar */}
      {sinTexto.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <ScanText className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {sinTexto.length} documento{sinTexto.length > 1 ? "s" : ""} sin digitalizar
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Sin texto digital los agentes de IA no pueden analizar estos archivos. Digitalizalos con OCR para desbloquear todas las funciones.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            onClick={handleDigitalizarTodos}
            disabled={generandoTodos}
          >
            {generandoTodos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generandoTodos ? "Digitalizando..." : `Digitalizar todos con IA`}
          </Button>
        </div>
      )}

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
          const sinTextoDoc = !doc.contenido_texto;
          const estaDigitalizando = digitalizando[doc.id];

          return (
            <div key={doc.id} className={`px-4 py-4 hover:bg-muted/20 transition-colors ${sinTextoDoc ? "bg-amber-50/30" : ""}`}>
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-muted-foreground w-6 shrink-0 mt-0.5">{idx + 1}</span>
                <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${sinTextoDoc ? "text-amber-400" : "text-muted-foreground"}`} />

                <div className="flex-1 min-w-0 space-y-1">
                  {edit ? (
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
                      ) : doc.contenido_texto ? (
                        <button
                          onClick={() => handleExtraerFecha(doc)}
                          disabled={extrayendoFecha[doc.id]}
                          className="flex items-center gap-1 text-xs text-primary/60 italic hover:text-primary transition-colors disabled:opacity-40"
                        >
                          {extrayendoFecha[doc.id]
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Extrayendo fecha...</>
                            : <><Calendar className="w-3 h-3" /> Extraer fecha con IA</>
                          }
                        </button>
                      ) : null}
                    </div>
                  )}

                  {/* Fuente */}
                  {doc.fuente && (
                    <p className="text-xs text-muted-foreground">Fuente: {doc.fuente}</p>
                  )}

                  {/* Estado del documento: sin digitalizar / resumen / sin texto */}
                  {sinTextoDoc ? (
                    <div className="flex items-center gap-2 mt-1">
                      {estaDigitalizando ? (
                        <span className="flex items-center gap-1.5 text-xs text-amber-700">
                          <Loader2 className="w-3 h-3 animate-spin" /> Digitalizando con IA... esto puede tomar unos segundos
                        </span>
                      ) : (
                        <>
                          <span className="text-xs text-amber-700 italic">Sin texto digital — los agentes no pueden analizar este documento</span>
                          {doc.file_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-100"
                              onClick={() => handleDigitalizar(doc)}
                            >
                              <ScanText className="w-3 h-3" /> Digitalizar con IA
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  ) : res?.loading ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Generando resumen...
                    </div>
                  ) : res?.text ? (
                    <p className="text-sm text-foreground/80 leading-relaxed mt-1">{res.text}</p>
                  ) : null}

                  {/* Notas */}
                  {doc.notas && (
                    <p className="text-xs text-muted-foreground italic">{doc.notas}</p>
                  )}
                </div>

                {/* Acciones derecha */}
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  {doc.contenido_texto && (
                    <Button
                      size="sm" variant="ghost"
                      title="Re-digitalizar"
                      onClick={() => handleDigitalizar(doc)}
                      disabled={estaDigitalizando}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                    >
                      {estaDigitalizando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </Button>
                  )}
                  {doc.file_url && (
                    <Button size="sm" variant="ghost" asChild className="h-7 w-7 p-0">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
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