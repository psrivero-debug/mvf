import { base44 } from "@/api/base44Client";

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