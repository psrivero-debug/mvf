import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw } from "lucide-react";
import { getStats, getAllTime, resetUsage } from "@/lib/tokenTracker";

const PROVIDERS = {
  base44: { label: "Base44", color: "bg-blue-500", text: "text-blue-700" },
  gemini: { label: "Gemini", color: "bg-emerald-500", text: "text-emerald-700" },
  deepseek: { label: "DeepSeek", color: "bg-purple-500", text: "text-purple-700" },
  local: { label: "Local (WebLLM)", color: "bg-amber-500", text: "text-amber-700" },
};

const fmt = (n) => n.toLocaleString("es-AR");

export default function ConsumoIA() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("ai-usage-updated", h);
    return () => window.removeEventListener("ai-usage-updated", h);
  }, []);

  const stats = getStats();
  const all = getAllTime();
  const entries = Object.entries(stats.byProvider).sort((a, b) => b[1].tokens - a[1].tokens);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="hidden sm:inline">Consumo IA</span>
          <span className="font-semibold">{fmt(stats.total)}</span>
          <span className="text-xs text-muted-foreground hidden md:inline">tokens</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-sm">Consumo de IA — mes en curso</h3>
            <p className="text-xs text-muted-foreground">
              {fmt(stats.calls)} consultas · {fmt(stats.total)} tokens estimados
            </p>
          </div>

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aún no hay consultas este mes.
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map(([key, s]) => {
                const p = PROVIDERS[key] || { label: key, color: "bg-slate-500", text: "text-slate-700" };
                const pct = stats.total > 0 ? Math.round((s.tokens / stats.total) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-medium ${p.text}`}>{p.label}</span>
                      <span className="text-muted-foreground">{fmt(s.tokens)} tokens · {s.calls} consultas</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${p.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Total histórico: {fmt(all.total)} tokens
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => { if (confirm("¿Reiniciar el contador de consumo?")) resetUsage(); }}
            >
              <RotateCcw className="w-3 h-3" /> Reiniciar
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/70 leading-tight">
            Tokens estimados (~4 caracteres = 1 token). Orientativo para prever el plan.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}