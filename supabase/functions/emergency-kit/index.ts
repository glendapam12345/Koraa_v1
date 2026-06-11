// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ModuleId =
  | 'music'
  | 'movies'
  | 'shows'
  | 'books'
  | 'internet'
  | 'places'
  | 'support_circle'
  | 'letters'
  | 'memory_box';

type RequestBody = {
  eventId?: string;
  customText?: string;
  locale?: 'es' | 'en';
  recentEmotions?: string[];
  avgEnergy?: number | null;
  energyTrend?: string;
  checkInCount?: number;
  savedItemTitles?: string[];
  letterSnippets?: string[];
  preferences?: Record<string, string | undefined>;
  savedItemIds?: string[];
};

type ResponseBody = {
  supportMessage: string;
  gentleActions: string[];
  patternInsight?: string;
  crisisMode: boolean;
  prioritizedModules: ModuleId[];
  recommendedItemIds: string[];
};

const DEFAULT_MODULES: ModuleId[] = [
  'music',
  'letters',
  'support_circle',
  'shows',
  'movies',
  'books',
  'internet',
  'places',
  'memory_box',
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildSystemPrompt(locale: 'es' | 'en'): string {
  if (locale === 'en') {
    return `You are Koraa Emergency Kit — a warm, emotionally intelligent companion for overwhelming moments. NOT productivity. Tone: compassionate, calm, human. Never toxic positivity. Never say "everything happens for a reason", "just move on", "stay positive". Never mention tasks, hustle, or achievement. Respond ONLY valid JSON: {"supportMessage":"...","gentleActions":["..."],"patternInsight":"...","crisisMode":true,"prioritizedModules":["music","letters",...],"recommendedItemIds":[]}. supportMessage: 2-3 personalized sentences using their event, custom text, emotions, energy. gentleActions: 4-5 tiny self-care steps (water, walk, comfort show — NOT productivity). patternInsight: optional gentle observation from trends. crisisMode: true for breakup, grief, pet loss, job loss, panic. prioritizedModules: reorder comfort modules for their situation. recommendedItemIds: subset of savedItemIds that fit now (or empty).`;
  }
  return `Eres Koraa Emergency Kit — compañía cálida para momentos abrumadores. NO productividad. Tono: compasivo, calmado, humano. Sin positividad tóxica. Nunca digas "todo pasa por algo", "sigue adelante", "mantente positiva". Nunca menciones tareas ni logros. Responde SOLO JSON válido: {"supportMessage":"...","gentleActions":["..."],"patternInsight":"...","crisisMode":true,"prioritizedModules":["music","letters",...],"recommendedItemIds":[]}. supportMessage: 2-3 frases personalizadas con su situación, texto, emociones, energía. gentleActions: 4-5 pasos de autocuidado (agua, paseo, serie de confort — NO productividad). patternInsight: observación suave opcional. crisisMode: true en ruptura, duelo, mascota, trabajo, pánico. prioritizedModules: reordenar módulos de confort. recommendedItemIds: ids guardados que encajen (o []).`;
}

async function callOpenAI(apiKey: string, locale: 'es' | 'en', payload: RequestBody) {
  const userContent = JSON.stringify(payload);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(locale) },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    return { error: await res.text(), status: res.status };
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) return { error: 'empty content' };

  try {
    return { data: JSON.parse(content) as ResponseBody };
  } catch {
    return { error: 'invalid json' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return jsonResponse({ error: 'AI not configured' }, 503);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const locale = body.locale === 'en' ? 'en' : 'es';
  const result = await callOpenAI(apiKey, locale, body);

  if (result.error || !result.data) {
    return jsonResponse({ error: result.error ?? 'AI failed' }, 502);
  }

  const data = result.data;
  const response: ResponseBody = {
    supportMessage: String(data.supportMessage ?? ''),
    gentleActions: Array.isArray(data.gentleActions)
      ? data.gentleActions.map(String).slice(0, 6)
      : [],
    patternInsight: data.patternInsight ? String(data.patternInsight) : undefined,
    crisisMode: Boolean(data.crisisMode),
    prioritizedModules: Array.isArray(data.prioritizedModules)
      ? data.prioritizedModules.filter((m): m is ModuleId =>
          DEFAULT_MODULES.includes(m as ModuleId)
        )
      : DEFAULT_MODULES,
    recommendedItemIds: Array.isArray(data.recommendedItemIds)
      ? data.recommendedItemIds.map(String)
      : [],
  };

  if (!response.supportMessage || response.gentleActions.length === 0) {
    return jsonResponse({ error: 'Incomplete AI response' }, 502);
  }

  return jsonResponse(response);
});
