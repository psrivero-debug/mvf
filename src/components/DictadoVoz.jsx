import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

export default function DictadoVoz({ onTexto, disabled }) {
  const [escuchando, setEscuchando] = useState(false);
  const recRef = useRef(null);

  const toggle = () => {
    if (escuchando) {
      recRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Tu navegador no soporta dictado por voz. Probá con Chrome o Edge.");
      return;
    }
    const rec = new SR();
    rec.lang = "es-AR";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let texto = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        texto += e.results[i][0].transcript;
      }
      if (texto.trim()) onTexto(texto.trim());
    };
    rec.onend = () => setEscuchando(false);
    rec.onerror = () => setEscuchando(false);
    recRef.current = rec;
    rec.start();
    setEscuchando(true);
  };

  return (
    <Button
      type="button"
      onClick={toggle}
      disabled={disabled}
      size="icon"
      variant={escuchando ? "destructive" : "outline"}
      className="h-auto shrink-0"
      title={escuchando ? "Detener dictado" : "Dictar por voz"}
    >
      {escuchando ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
    </Button>
  );
}