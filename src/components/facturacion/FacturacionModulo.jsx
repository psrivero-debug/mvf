import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Settings, History } from "lucide-react";
import NuevaFactura from "./NuevaFactura";
import HistorialFacturas from "./HistorialFacturas";
import ConfiguracionFacturacion from "./ConfiguracionFacturacion";

export default function FacturacionModulo() {
  const { data: config = null, refetch: refetchConfig } = useQuery({
    queryKey: ["config_facturacion"],
    queryFn: async () => {
      const list = await base44.entities.ConfigFacturacion.list();
      return list[0] || null;
    },
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">Facturación Electrónica</h1>
        <p className="text-sm text-muted-foreground mt-1">Factura C — Monotributo</p>
      </div>

      <Tabs defaultValue="nueva">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="nueva" className="gap-2">
            <FileText className="w-4 h-4" /> Nueva Factura
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-2">
            <History className="w-4 h-4" /> Historial
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="w-4 h-4" /> Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nueva" className="mt-6">
          <NuevaFactura config={config} />
        </TabsContent>

        <TabsContent value="historial" className="mt-6">
          <HistorialFacturas />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <ConfiguracionFacturacion config={config} onSave={refetchConfig} />
        </TabsContent>
      </Tabs>
    </div>
  );
}