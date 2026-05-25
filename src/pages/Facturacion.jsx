import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FacturacionModulo from "@/components/facturacion/FacturacionModulo";

const CLAVE = "838";

export default function Facturacion() {
  const [input, setInput] = useState("");
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [error, setError] = useState(false);

  const handleUnlock = () => {
    if (input === CLAVE) {
      setDesbloqueado(true);
      setError(false);
    } else {
      setError(true);
      setInput("");
    }
  };

  if (!desbloqueado) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-sm p-8 rounded-2xl border bg-card shadow-lg text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold">Facturación</h2>
            <p className="text-sm text-muted-foreground mt-1">Ingresá la clave para acceder al módulo</p>
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Clave de acceso"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-xs text-destructive">Clave incorrecta. Intentá de nuevo.</p>}
            <Button className="w-full" onClick={handleUnlock}>Ingresar</Button>
          </div>
        </div>
      </div>
    );
  }

  return <FacturacionModulo />;
}