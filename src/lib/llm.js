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