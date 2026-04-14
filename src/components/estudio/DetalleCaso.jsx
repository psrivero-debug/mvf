import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Bot, BookOpen, List } from "lucide-react";
import DocumentosList from "./DocumentosList";
import AgenteIA from "./AgenteIA";
import ExportarCaso from "./ExportarCaso";
import IndiceCaso from "./IndiceCaso";

const tabs = [
  { id: "indice", label: "Índice", icon: List },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "agentes", label: "Agentes IA", icon: Bot },
];

export default function DetalleCaso({ caso, onBack }) {
  const [activeTab, setActiveTab] = useState("indice");

  const { data: documentos = [] } = useQuery({
    queryKey: ["caso_documentos", caso.id],
    queryFn: () => base44.entities.CasoDocumento.filter({ caso_id: caso.id }, "orden"),
  });

  const { data: analisis = [] } = useQuery({
    queryKey: ["caso_analisis", caso.id],
    queryFn: () => base44.entities.CasoAnalisis.filter({ caso_id: caso.id }, "-created_date"),
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 shrink-0 mt-1">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {caso.numero_expediente && (
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">#{caso.numero_expediente}</span>
            )}
            <h1 className="text-xl lg:text-2xl font-serif font-bold">{caso.titulo}</h1>
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
            {caso.client_name && <span>Cliente: <strong>{caso.client_name}</strong></span>}
            {caso.jurisdiccion && <span>· {caso.jurisdiccion}</span>}
            {caso.partes && <span className="text-xs mt-0.5 block w-full">{caso.partes}</span>}
          </div>
        </div>
        <div className="shrink-0 mt-1">
          <ExportarCaso caso={caso} documentos={documentos} analisis={analisis} />
        </div>
      </div>

      {/* Info rápida */}
      {caso.descripcion && (
        <div className="p-4 rounded-lg bg-muted/50 border text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Descripción</p>
          <p>{caso.descripcion}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {(id === "documentos" || id === "indice") && documentos.length > 0 && (
              <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{documentos.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "indice" && <IndiceCaso documentos={documentos} />}
      {activeTab === "documentos" && <DocumentosList caso={caso} documentos={documentos} />}
      {activeTab === "agentes" && <AgenteIA caso={caso} documentos={documentos} />}
    </div>
  );
}