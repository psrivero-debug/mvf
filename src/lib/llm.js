import { base44 } from "@/api/base44Client";
import { invokeWebLLM } from "./webllm";

/**
 * Wrapper de InvokeLLM con fallback automático a Gemini (IA complementaria).
 * Si las integraciones de Base44 se agotan o fallan, usa la función backend
 * geminiLLM (Google AI Studio) con los mismos parámetros e indicaciones.
 * Dispara un evento 'llm-fallback' para que la UI notifique al usuario.
 */
export async function invokeLLM(params) {
  try {
    return await base44.integrations.Core.InvokeLLM(params);
  } catch (err) {
    const res = await base44.functions.invoke("geminiLLM", params);
    window.dispatchEvent(new CustomEvent("llm-fallback"));
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
    base44.functions.invoke("geminiLLM", params).then(r => r.data),
  ]);
  return {
    base44: base44Res.status === "fulfilled" ? base44Res.value : null,
    gemini: geminiRes.status === "fulfilled" ? geminiRes.value : null,
  };
}

/**
 * Llama directamente a DeepSeek (IA económica, no consume créditos de Base44).
 * Soporta texto y JSON estructurado. Sin visión ni búsqueda web.
 */
export async function invokeDeepSeek(params) {
  const res = await base44.functions.invoke("deepseekLLM", params);
  return res.data;
}

/**
 * Ejecuta Base44, Gemini y DeepSeek en paralelo y devuelve las tres respuestas
 * para comparar diferencias de apreciación entre los motores.
 */
export async function invokeAll(params) {
  const [base44Res, geminiRes, deepseekRes] = await Promise.allSettled([
    base44.integrations.Core.InvokeLLM(params),
    base44.functions.invoke("geminiLLM", params).then(r => r.data),
    base44.functions.invoke("deepseekLLM", params).then(r => r.data),
  ]);
  return {
    base44: base44Res.status === "fulfilled" ? base44Res.value : null,
    gemini: geminiRes.status === "fulfilled" ? geminiRes.value : null,
    deepseek: deepseekRes.status === "fulfilled" ? deepseekRes.value : null,
  };
}

/**
 * Ejecuta Base44, Gemini, DeepSeek y WebLLM (local) en paralelo.
 * onLocalProgress recibe (progress, text) para mostrar el avance de descarga del modelo local.
 */
export async function invokeAllWithLocal(params, onLocalProgress) {
  const [base44Res, geminiRes, deepseekRes, localRes] = await Promise.allSettled([
    base44.integrations.Core.InvokeLLM(params),
    base44.functions.invoke("geminiLLM", params).then(r => r.data),
    base44.functions.invoke("deepseekLLM", params).then(r => r.data),
    invokeWebLLM(params.prompt, onLocalProgress),
  ]);
  return {
    base44: base44Res.status === "fulfilled" ? base44Res.value : null,
    gemini: geminiRes.status === "fulfilled" ? geminiRes.value : null,
    deepseek: deepseekRes.status === "fulfilled" ? deepseekRes.value : null,
    local: localRes.status === "fulfilled" ? localRes.value : null,
  };
}