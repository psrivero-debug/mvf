import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Reemplazo de InvokeLLM usando DeepSeek directamente.
// No consume créditos de "integraciones" de Base44.
// Soporta: texto y JSON estructurado. (DeepSeek no tiene visión ni búsqueda web nativa.)

const DEFAULT_MODEL = "deepseek-chat";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      prompt,
      response_json_schema,
      model = DEFAULT_MODEL,
    } = body;

    if (!prompt) return Response.json({ error: 'prompt es requerido' }, { status: 400 });

    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) return Response.json({ error: 'DEEPSEEK_API_KEY no configurado' }, { status: 500 });

    const validModel = (typeof model === "string" && model.startsWith("deepseek-")) ? model : DEFAULT_MODEL;
    const wantsJson = !!response_json_schema;

    const payload = {
      model: validModel,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    };
    if (wantsJson) {
      payload.response_format = { type: "json_object" };
      payload.messages[0].content = prompt + "\n\nIMPORTANTE: Responde SOLO con un JSON válido, sin texto adicional ni markdown.";
    }

    const apiResp = await fetch("https://api.deepseek.com/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!apiResp.ok) {
      const errText = await apiResp.text();
      return Response.json({ error: `DeepSeek API error ${apiResp.status}: ${errText}` }, { status: 502 });
    }

    const data = await apiResp.json();
    const text = data?.choices?.[0]?.message?.content || '';

    if (wantsJson) {
      try {
        const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return Response.json(JSON.parse(cleaned));
      } catch (e) {
        return Response.json({ error: 'No se pudo parsear JSON', raw: text });
      }
    }

    return Response.json(text);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});