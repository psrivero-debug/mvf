import * as webllm from "@mlc-ai/web-llm";

// IA 100% local en el navegador vía WebGPU (WebLLM / MLC AI).
// No consume créditos ni envía datos a ningún servidor.
// Requiere navegador con WebGPU (Chrome/Edge). Primera vez descarga el modelo (~1 GB) y lo cachea.

const MODEL_ID = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
let enginePromise = null;
let engine = null;

export function isWebLLMSupported() {
  return typeof navigator !== "undefined" && !!navigator.gpu;
}

async function getEngine(onProgress) {
  if (engine) return engine;
  if (!enginePromise) {
    enginePromise = webllm.CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (report) => {
        if (onProgress) onProgress(report.progress || 0, report.text || "");
      },
    });
  }
  engine = await enginePromise;
  return engine;
}

export async function invokeWebLLM(prompt, onProgress) {
  if (!isWebLLMSupported()) {
    return "*WebGPU no disponible en este navegador. Usá Chrome o Edge con WebGPU habilitado.*";
  }
  try {
    const eng = await getEngine(onProgress);
    const reply = await eng.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
    });
    return reply.choices[0].message.content;
  } catch (e) {
    return "*Error local: " + (e.message || String(e)) + "*";
  }
}