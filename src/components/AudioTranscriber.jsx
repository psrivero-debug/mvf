import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square, Upload, Loader2, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AudioTranscriber({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-AR";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          onTranscript(finalTranscript.trim());
          setInterim("");
        } else {
          interimText += transcript;
        }
      }
      setInterim(interimText);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setInterim("");
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterim("");
      finalTranscript = "";
    };

    recognitionRef.current = recognition;

    return () => recognition.abort();
  }, [onTranscript]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Transcribí con exactitud el audio adjunto al español argentino. Devolvé solo el texto transcripto, sin comentarios ni explicaciones adicionales.`,
        file_urls: [file_url],
      });
      onTranscript(result);
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  if (!supported) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant={isRecording ? "destructive" : "outline"}
          size="sm"
          onClick={toggleRecording}
          className="gap-2"
          disabled={isProcessing}
        >
          {isRecording ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              Detener grabación
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              Grabar con micrófono
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
          disabled={isRecording || isProcessing}
        >
          {isProcessing ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribiendo...</>
          ) : (
            <><Upload className="w-3.5 h-3.5" /> Subir audio</>
          )}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs text-destructive font-medium">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            Grabando...
          </span>
        )}
      </div>

      {interim && (
        <div className="text-xs text-muted-foreground italic px-2 py-1 bg-muted rounded-md">
          {interim}
        </div>
      )}
    </div>
  );
}