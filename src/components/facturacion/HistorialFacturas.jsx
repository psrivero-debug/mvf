import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, XCircle } from "lucide-react";
import { useState } from "react";
import VistaFactura from "./VistaFactura";

export default function HistorialFacturas() {
  const queryClient = useQueryClient();
  const [verFactura, setVerFactura] = useState(null);

  const { data: facturas = [] } = useQuery({
    queryKey: ["facturas_c"],
    queryFn: () => base44.entities.FacturaC.list("-created_date", 100),
  });

  const anular = async (id) => {
    if (!confirm("¿Anular esta factura?")) return;
    await base44.entities.FacturaC.update(id, { estado: "anulada" });
    queryClient.invalidateQueries({ queryKey: ["facturas_c"] });
  };

  const condicionLabel = {
    consumidor_final: "Consumidor Final",
    monotributista: "Monotributista",
    responsable_inscripto: "Resp. Inscripto",
    exento: "Exento",
    no_responsable: "No Responsable",
  };

  return (
    <div className="space-y-4">
      {verFactura && (
        <VistaFactura factura={verFactura} onClose={() => setVerFactura(null)} />
      )}

      {facturas.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No hay facturas emitidas aún.</p>
        </div>
      )}

      <div className="space-y-2">
        {facturas.map(f => (
          <div key={f.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-semibold text-primary">
                  FC {f.punto_venta || "0001"}-{String(f.numero || "").padStart(8, "0")}
                </span>
                <Badge variant={f.estado === "emitida" ? "default" : "destructive"}>
                  {f.estado === "emitida" ? "Emitida" : "Anulada"}
                </Badge>
              </div>
              <p className="text-sm font-medium mt-0.5">{f.cliente_nombre}</p>
              <p className="text-xs text-muted-foreground">
                {f.fecha_emision} · {condicionLabel[f.cliente_condicion_iva] || f.cliente_condicion_iva}
                {f.cae && <span className="ml-2 font-mono">CAE: {f.cae}</span>}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-lg">${Number(f.total || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">{f.forma_pago}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => setVerFactura(f)}>
                <Eye className="w-4 h-4" />
              </Button>
              {f.estado === "emitida" && (
                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => anular(f.id)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}