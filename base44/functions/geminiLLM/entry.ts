import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Reemplazo de InvokeLLM usando Google AI Studio (Gemini) directamente.
// No consume créditos de "integraciones" de Base44.
// Soporta: texto, visión (imágenes vía file_urls), búsqueda web (grounding) y JSON estructurado.

const DEFAULT_MODEL = "gemini-2.5-flash";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      prompt,
      file_urls,
      add_context_from_internet = false,
      response_json_schema,
      model = DEFAULT_MODEL,
    } = body;

    if (!prompt) return Response.json({ error: 'prompt es requerido' }, { status: 400 });

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return Response.json({ error: 'GEMINI_API_KEY no configurado' }, { status: 500 });

    // Construir las partes del contenido
    const parts = [{ text: prompt }];

    // Procesar imágenes/documentos adjuntos (file_urls)
    const urls = Array.isArray(file_urls) ? file_urls : (file_urls ? [file_urls] : []);
    for (const url of urls) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const contentType = resp.headers.get('content-type') || 'application/octet-stream';
        const buffer = await resp.arrayBuffer();
        // Codificación base64 por chunks para evitar desbordamiento de pila
        // en archivos grandes (btoa(String.fromCharCode(...spread)) falla >~8MB).
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        const base64 = btoa(binary);
        parts.push({
          inlineData: {
            mimeType: contentType,
            data: base64,
          },
        });
      } catch (e) {
        // Si no se puede descargar, se ignora
      }
    }

    const generationConfig = {};
    const tools = [];

    // JSON estructurado + búsqueda web no son compatibles juntos en Gemini.
    // Si piden ambos, usamos búsqueda web y pedimos JSON en el prompt, luego parseamos.
    const wantsJson = !!response_json_schema;
    const wantsSearch = !!add_context_from_internet;

    if (wantsJson && !wantsSearch) {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseSchema = response_json_schema;
    } else if (wantsSearch) {
      tools.push({ googleSearch: {} });
      if (wantsJson) {
        // Avisar al modelo que devuelva solo JSON
        parts[0] = { text: prompt + "\n\nIMPORTANTE: Responde SOLO con un JSON válido, sin texto adicional ni markdown." };
      }
    }

    const payload = {
      contents: [{ role: "user", parts }],
      generationConfig,
    };
    if (tools.length > 0) payload.tools = tools;

    const apiVersion = "v1beta";
    // Sanitizar modelo: si no es un modelo Gemini válido, usar el default
    const validModel = (typeof model === "string" && model.startsWith("gemini-")) ? model : DEFAULT_MODEL;
    const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${validModel}:generateContent?key=${apiKey}`;

    const apiResp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!apiResp.ok) {
      const errText = await apiResp.text();
      return Response.json({ error: `Gemini API error ${apiResp.status}: ${errText}` }, { status: 502 });
    }

    const data = await apiResp.json();

    // Extraer texto de la respuesta
    const candidate = data?.candidates?.[0];
    const textParts = candidate?.content?.parts || [];
    let text = textParts.map(p => p.text || '').join('');

    // Si se pidió JSON y usamos búsqueda web (sin responseSchema), parsear el texto
    if (wantsJson && wantsSearch) {
      try {
        // Limpiar posibles fences de markdown
        const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return Response.json(JSON.parse(cleaned));
      } catch (e) {
        // Si no se puede parsear, devolver como texto
        return Response.json({ error: 'No se pudo parsear JSON', raw: text });
      }
    }

    // Si se pidió JSON con responseSchema, Gemini ya devuelve JSON válido
    if (wantsJson) {
      try {
        return Response.json(JSON.parse(text));
      } catch (e) {
        return Response.json({ error: 'No se pudo parsear JSON', raw: text });
      }
    }

    // Respuesta de texto plano
    return Response.json(text);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});