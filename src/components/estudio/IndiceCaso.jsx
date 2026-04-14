import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Calendar, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const tipoLabels = {
  escrito: "Escrito",
  sentencia: "Sentencia",
  pericia: "Pericia",
  testimonio: "Testimonio",
  contrato: "Contrato",
  imagen: "Imagen",
  pdf: "PDF",
  otro: "Otro",
};

const tipoColors = {
  escrito: "bg-blue-100 text-blue-700",
  sentencia: "bg-purple-100 text-purple-700",
  pericia: "bg-orange-100 text-orange-700",
  testimonio: "bg-green-100 text-green-700",
  contrato: "bg-yellow-100 text-yellow-700",
  imagen: "bg-pink-100 text-pink-700",
  pdf: "bg-red-100 text-red-700",
  otro: "bg-gray-100 text-gray-600",
};

export default function IndiceCaso({ documentos }) {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [sortBy, setSortBy] = useState("orden");

  const filtered = documentos
    .filter(d => {
      const matchSearch =
        d.titulo?.toLowerCase().includes(search.toLowerCase()) ||
        d.fuente?.toLowerCase().includes(search.toLowerCase()) ||
        d.notas?.toLowerCase().includes(search.toLowerCase());
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
            placeholder="Buscar por título, fuente, notas..."
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

      {/* Resumen */}
      <p className="text-xs text-muted-foreground">
        Mostrando <strong>{filtered.length}</strong> de <strong>{documentos.length}</strong> documentos
      </p>

      {/* Tabla / Lista */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-6">#</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Fuente</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((doc, idx) => (
              <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium leading-snug">{doc.titulo}</p>
                      {/* Tipo visible en mobile */}
                      <div className="sm:hidden mt-1 flex flex-wrap gap-1">
                        {doc.tipo_documento && (
                          <Badge className={`${tipoColors[doc.tipo_documento]} text-xs py-0`} variant="secondary">
                            {tipoLabels[doc.tipo_documento]}
                          </Badge>
                        )}
                        {doc.fecha_documento && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(doc.fecha_documento), "d MMM yyyy", { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {doc.tipo_documento ? (
                    <Badge className={`${tipoColors[doc.tipo_documento]} text-xs py-0`} variant="secondary">
                      {tipoLabels[doc.tipo_documento]}
                    </Badge>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                  {doc.fuente || "—"}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs whitespace-nowrap">
                  {doc.fecha_documento
                    ? format(new Date(doc.fecha_documento), "d MMM yyyy", { locale: es })
                    : "—"}
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs max-w-[200px] truncate">
                  {doc.notas || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No hay documentos que coincidan con la búsqueda
          </div>
        )}
      </div>
    </div>
  );
}