import { useState } from "react";
import { Loader2 } from "lucide-react";
import { resolverTextoRef as resolverContenido } from "@/lib/privateFiles";

export default function LeerCompleto({ contenido_texto }) {
  const [texto, setTexto] = useState(null);
  const [abierto, setAbierto] = useState(false);

  const handleAbrir = async () => {
    if (!abierto && texto === null) {
      const resuelto = await resolverContenido(contenido_texto);
      setTexto(resuelto);
    }
    setAbierto(prev => !prev);
  };

  return (
    <div className="mt-2">
      <button onClick={handleAbrir} className="text-xs text-primary cursor-pointer hover:underline select-none">
        {abierto ? "Ocultar texto" : "Leer completo"}
      </button>
      {abierto && (
        <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-96 overflow-y-auto border leading-relaxed">
          {texto === null ? <Loader2 className="w-3 h-3 animate-spin" /> : texto}
        </div>
      )}
    </div>
  );
}