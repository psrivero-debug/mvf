import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { X, Printer, CheckCircle2 } from "lucide-react";

const condicionLabel = {
  consumidor_final: "Consumidor Final",
  monotributista: "Monotributista",
  responsable_inscripto: "Responsable Inscripto",
  exento: "Exento",
  no_responsable: "No Responsable",
};

const conceptoLabel = {
  productos: "Productos",
  servicios: "Servicios",
  productos_y_servicios: "Productos y Servicios",
};

export default function VistaFactura({ factura, config: configProp, onClose }) {
  const { data: configs = [] } = useQuery({
    queryKey: ["config_facturacion"],
    queryFn: async () => base44.entities.ConfigFacturacion.list(),
    enabled: !configProp,
  });
  const config = configProp || configs[0] || null;

  const handlePrint = () => window.print();

  const items = Array.isArray(factura.items) ? factura.items : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-auto py-8 px-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b print:hidden">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm">Factura emitida correctamente</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
              <Printer className="w-4 h-4" /> Imprimir / PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Factura */}
        <div id="factura-print" className="p-8 text-sm font-sans text-gray-800">
          {/* Encabezado */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {config && (
                <>
                  <h2 className="text-lg font-bold">{config.nombre_emisor}</h2>
                  <p className="text-xs text-gray-500">CUIT: {config.cuit}</p>
                  <p className="text-xs text-gray-500">Monotributista — Cat. {config.categoria_monotributo}</p>
                  {config.domicilio_fiscal && <p className="text-xs text-gray-500">{config.domicilio_fiscal}, {config.localidad}, {config.provincia}</p>}
                  {config.actividad && <p className="text-xs text-gray-500">Actividad: {config.actividad}</p>}
                  {config.inicio_actividades && <p className="text-xs text-gray-500">Inicio act.: {config.inicio_actividades}</p>}
                </>
              )}
            </div>
            <div className="text-center border-2 border-gray-800 px-6 py-3 rounded-lg ml-4">
              <p className="text-3xl font-black text-gray-800">C</p>
              <p className="text-xs font-semibold text-gray-600">FACTURA</p>
              <p className="text-xs text-gray-500 mt-1">N° {factura.punto_venta || "0001"}-{String(factura.numero || "").padStart(8, "0")}</p>
              <p className="text-xs text-gray-500">Fecha: {factura.fecha_emision}</p>
            </div>
          </div>

          <div className="border-t border-b border-gray-200 py-2 mb-4 text-xs text-gray-500 text-center font-medium">
            IVA NO APLICA — MONOTRIBUTISTA
          </div>

          {/* Datos cliente */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-700 mb-1">DATOS DEL CLIENTE</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              <p><span className="text-gray-500">Nombre/Razón social:</span> <strong>{factura.cliente_nombre}</strong></p>
              {factura.cliente_cuit_dni && <p><span className="text-gray-500">DNI/CUIT:</span> {factura.cliente_cuit_dni}</p>}
              <p><span className="text-gray-500">Condición IVA:</span> {condicionLabel[factura.cliente_condicion_iva] || factura.cliente_condicion_iva}</p>
              {factura.cliente_domicilio && <p><span className="text-gray-500">Domicilio:</span> {factura.cliente_domicilio}</p>}
              <p><span className="text-gray-500">Concepto:</span> {conceptoLabel[factura.concepto] || factura.concepto}</p>
              <p><span className="text-gray-500">Forma de pago:</span> {factura.forma_pago}</p>
            </div>
          </div>

          {/* Tabla items */}
          <table className="w-full text-xs mb-4 border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="text-left py-2 px-3">Descripción</th>
                <th className="text-center py-2 px-2 w-16">Cant.</th>
                <th className="text-right py-2 px-3 w-28">P. Unitario</th>
                <th className="text-right py-2 px-3 w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-1.5 px-3">{item.descripcion}</td>
                  <td className="py-1.5 px-2 text-center">{item.cantidad}</td>
                  <td className="py-1.5 px-3 text-right">${Number(item.precio_unitario || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                  <td className="py-1.5 px-3 text-right">${Number(item.subtotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end mb-4">
            <div className="border border-gray-800 rounded-lg px-6 py-3 text-right">
              <p className="text-xs text-gray-500">IVA no aplica — Monotributista</p>
              <p className="text-xl font-black text-gray-800 mt-1">
                TOTAL: ${Number(factura.total || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* CAE */}
          {factura.cae && (
            <div className="border border-dashed border-gray-400 rounded-lg p-3 mb-4 text-xs text-center">
              <p className="font-semibold text-gray-700">COMPROBANTE AUTORIZADO POR AFIP</p>
              <p>CAE N°: <strong>{factura.cae}</strong></p>
              {factura.cae_vencimiento && <p>Vencimiento CAE: {factura.cae_vencimiento}</p>}
            </div>
          )}

          {/* Notas */}
          {factura.notas && (
            <div className="text-xs text-gray-500 border-t pt-3">
              <p className="font-semibold mb-0.5">Observaciones:</p>
              <p>{factura.notas}</p>
            </div>
          )}

          {/* Footer */}
          {config && (
            <div className="mt-4 pt-3 border-t text-xs text-gray-400 text-center">
              {config.email_emisor && <span>{config.email_emisor}</span>}
              {config.telefono_emisor && <span> · {config.telefono_emisor}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}