import { Button } from "@/components/ui/button";
import { ArrowLeft, Files, MessagesSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProyectoDocumentos from "./ProyectoDocumentos";
import ProyectoChat from "./ProyectoChat";

export default function ProyectoVista({ consultor, proyecto, onVolver }) {
  const Icon = consultor.icon;
  const { data: documentos = [] } = useQuery({
    queryKey: ["proyecto_documentos", proyecto.id],
    queryFn: () => base44.entities.ProyectoDocumento.filter({ proyecto_id: proyecto.id }, "created_date"),
  });

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onVolver}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${consultor.color} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-serif font-semibold truncate">{proyecto.titulo}</h1>
          <p className="text-sm text-muted-foreground truncate">
            {consultor.nombre} · {documentos.length} documento{documentos.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <Tabs defaultValue="documentos">
        <TabsList>
          <TabsTrigger value="documentos" className="gap-2">
            <Files className="w-4 h-4" /> Documentos
          </TabsTrigger>
          <TabsTrigger value="consulta" className="gap-2">
            <MessagesSquare className="w-4 h-4" /> Consulta IA
          </TabsTrigger>
        </TabsList>
        <TabsContent value="documentos">
          <ProyectoDocumentos proyecto={proyecto} />
        </TabsContent>
        <TabsContent value="consulta">
          <ProyectoChat consultor={consultor} proyecto={proyecto} documentos={documentos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}