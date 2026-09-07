import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

/**
 * Caché global de resultados de IA.
 * Si se repite exactamente la misma consulta (mismo prompt, modelo, archivos
 * y esquema JSON), se devuelve el resultado guardado en localStorage sin
 * volver a gastar créditos de integración.
 * - params.forceFresh: omite la caché y genera una respuesta nueva.
 * - Las consultas con contexto de internet no se cachean (los resultados
 *   cambian con el tiempo).
 */
const CACHE_KEY = 'llm_response_cache_v1';
const CACHE_LIMIT = 60;

let _cache = {};
try { _cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { _cache = {}; }

let flushTimer = null;
const persist = () => {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(_cache)); } catch {}
  }, 300);
};

const hashParams = (params) => {
  const material = JSON.stringify([
    params.prompt,
    params.model || null,
    params.file_urls || null,
    params.response_json_schema || null,
  ]);
  let h = 0;
  for (let i = 0; i < material.length; i++) {
    h = (h * 31 + material.charCodeAt(i)) | 0;
  }
  return `${h}_${material.length}`;
};

const trimCache = () => {
  const keys = Object.keys(_cache);
  if (keys.length <= CACHE_LIMIT) return;
  keys
    .sort((a, b) => (_cache[a].ts || 0) - (_cache[b].ts || 0))
    .slice(0, keys.length - CACHE_LIMIT)
    .forEach(k => delete _cache[k]);
};

try {
  const originalInvokeLLM = base44.integrations.Core.InvokeLLM;
  base44.integrations.Core.InvokeLLM = async (params) => {
    const forceFresh = !!params?.forceFresh;
    if (params) delete params.forceFresh;

    // Sin prompt, sin contexto de internet y con caché habilitada -> usar caché
    const cacheable = params?.prompt && !params.add_context_from_internet && !forceFresh;
    const key = cacheable ? hashParams(params) : null;
    if (key && _cache[key]) return _cache[key].result;

    const result = await originalInvokeLLM(params);

    if (key && result != null) {
      _cache[key] = { result, ts: Date.now() };
      trimCache();
      persist();
    }
    return result;
  };
} catch {
  // Si el SDK no permite el override, la app sigue funcionando sin caché.
}