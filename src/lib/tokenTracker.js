// Registro local de consumo de IA (tokens estimados) para prever el plan.
// Persiste en localStorage y expone estadísticas por proveedor del mes en curso.

const KEY = "lexguard_ai_usage";
const MAX_CALLS = 1000;

export function estimateTokens(text) {
  if (!text) return 0;
  // Aproximación: ~4 caracteres = 1 token (regla de oro para español/español+inglés).
  return Math.ceil(String(text).length / 4);
}

export function recordUsage(provider, promptTokens, completionTokens) {
  const data = load();
  data.calls.push({
    provider,
    promptTokens,
    completionTokens,
    total: (promptTokens || 0) + (completionTokens || 0),
    ts: Date.now(),
  });
  if (data.calls.length > MAX_CALLS) data.calls = data.calls.slice(-MAX_CALLS);
  save(data);
  window.dispatchEvent(new CustomEvent("ai-usage-updated"));
}

export function getStats() {
  const data = load();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthCalls = data.calls.filter((c) => c.ts >= monthStart);

  const byProvider = {};
  let total = 0;
  monthCalls.forEach((c) => {
    if (!byProvider[c.provider]) byProvider[c.provider] = { calls: 0, tokens: 0, prompt: 0, completion: 0 };
    byProvider[c.provider].calls++;
    byProvider[c.provider].tokens += c.total;
    byProvider[c.provider].prompt += c.promptTokens || 0;
    byProvider[c.provider].completion += c.completionTokens || 0;
    total += c.total;
  });

  return { total, calls: monthCalls.length, byProvider };
}

export function getAllTime() {
  const data = load();
  let total = 0;
  data.calls.forEach((c) => (total += c.total));
  return { total, calls: data.calls.length };
}

export function resetUsage() {
  save({ calls: [] });
  window.dispatchEvent(new CustomEvent("ai-usage-updated"));
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { calls: [] };
  } catch {
    return { calls: [] };
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* almacenamiento lleno: ignorar */
  }
}