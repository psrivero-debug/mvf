import { base44 } from "@/api/base44Client";
import { invokeWebLLM } from "./webllm";
import { recordUsage, estimateTokens } from "./tokenTracker";

/**
 * Wrapper de InvokeLLM con fallback automático a Gemini (IA complementaria).
 * Si las integraciones de Base44 se agotan o fallan, usa la función backend
 * geminiLLM (Google AI Studio) con los mismos parámetros e indicaciones.
 * Dispara un evento 'llm-fallback' para que la UI notifique al usuario.
 * Registra el consumo de tokens estimado en el tracker local.
 */
export async function invokeLLM(params) {
  try {
    const res = await base44.integrations.Core.InvokeLLM(params);
    recordUsage("base44", estimateTokens(params.prompt), estimateTokens(res));
    return res;
  } catch (err) {
    const res = await base44.functions.invoke("geminiLLM", params);
    window.dispatchEvent(new CustomEvent("llm-fallback"));
    recordUsage("gemini", estimateTokens(params.prompt), estimateTokens(res.data));
    return res.data;
  }
}

/**
 * Ejecuta Base44 y Gemini en paralelo y devuelve ambas respuestas
 * para comparar diferencias de apreciación entre los dos motores.
 * Si Base44 falla (créditos agotados), su campo queda null.
 */
export async function invokeBoth(params) {
  const [base44Res, geminiRes] = await Promise.allSettled([
    base44.integrations.Core.InvokeLLM(params),
    base44.functions.invoke("geminiLLM", params).then((r) => r.data),
  ]);
  const b44 = base44Res.status === "fulfilled" ? base44Res.value : null;
  const gem = geminiRes.status === "fulfilled" ? geminiRes.value : null;
  if (b44) recordUsage("base44", estimateTokens(params.prompt), estimateTokens(b44));
  if (gem) recordUsage("gemini", estimateTokens(params.prompt), estimateTokens(gem));
  return { base44: b44, gemini: gem };
}

/**
 * Llama directamente a DeepSeek (IA económica, no consume créditos de Base44).
 * Soporta texto y JSON estructurado. Sin visión ni búsqueda web.
 */
export async function invokeDeepSeek(params) {
  const res = await base44.functions.invoke("deepseekLLM", params);
  recordUsage("deepseek", estimateTokens(params.prompt), estimateTokens(res.data));
  return res.data;
}

/**
 * Ejecuta Base44, Gemini y DeepSeek en paralelo y devuelve las tres respuestas
 * para comparar diferencias de apreciación entre los motores.
 */
export async function invokeAll(params) {
  const [base44Res, geminiRes, deepseekRes] = await Promise.allSettled([
    base44.integrations.Core.InvokeLLM(params),
    base44.functions.invoke("geminiLLM", params).then((r) => r.data),
    base44.functions.invoke("deepseekLLM", params).then((r) => r.data),
  ]);
  const b44 = base44Res.status === "fulfilled" ? base44Res.value : null;
  const gem = geminiRes.status === "fulfilled" ? geminiRes.value : null;
  const ds = deepseekRes.status === "fulfilled" ? deepseekRes.value : null;
  if (b44) recordUsage("base44", estimateTokens(params.prompt), estimateTokens(b44));
  if (gem) recordUsage("gemini", estimateTokens(params.prompt), estimateTokens(gem));
  if (ds) recordUsage("deepseek", estimateTokens(params.prompt), estimateTokens(ds));
  return { base44: b44, gemini: gem, deepseek: ds };
}

/**
 * Ejecuta Base44, Gemini, DeepSeek y WebLLM (local) en paralelo.
 * onLocalProgress recibe (progress, text) para mostrar el avance de descarga del modelo local.
 */
export async function invokeAllWithLocal(params, onLocalProgress) {
  const [base44Res, geminiRes, deepseekRes, localRes] = await Promise.allSettled([
    base44.integrations.Core.InvokeLLM(params),
    base44.functions.invoke("geminiLLM", params).then((r) => r.data),
    base44.functions.invoke("deepseekLLM", params).then((r) => r.data),
    invokeWebLLM(params.prompt, onLocalProgress),
  ]);
  const b44 = base44Res.status === "fulfilled" ? base44Res.value : null;
  const gem = geminiRes.status === "fulfilled" ? geminiRes.value : null;
  const ds = deepseekRes.status === "fulfilled" ? deepseekRes.value : null;
  const local = localRes.status === "fulfilled" ? localRes.value : null;
  if (b44) recordUsage("base44", estimateTokens(params.prompt), estimateTokens(b44));
  if (gem) recordUsage("gemini", estimateTokens(params.prompt), estimateTokens(gem));
  if (ds) recordUsage("deepseek", estimateTokens(params.prompt), estimateTokens(ds));
  if (local) recordUsage("local", estimateTokens(params.prompt), estimateTokens(local));
  return { base44: b44, gemini: gem, deepseek: ds, local };
}