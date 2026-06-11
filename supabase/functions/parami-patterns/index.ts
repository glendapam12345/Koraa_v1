// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PatternDay = {
  date?: string;
  emotion?: string;
  energy?: number;
  label?: string;
};

type PatternRequest = {
  locale?: 'es' | 'en';
  period?: 'week' | 'twoWeeks' | 'month';
  checkInCount?: number;
  avgEnergy?: number;
  topEmotions?: { key?: string; count?: number }[];
  days?: PatternDay[];
};

type PatternResponse = {
  headline: string;
  summary: string;
  patternNote: string;
  gentleTip: string;
};

function periodName(locale: 'es' | 'en', period: string): string {
  if (period === 'month') return locale === 'en' ? 'the last 30 days' : 'los últimos 30 días';
  if (period === 'twoWeeks') return locale === 'en' ? 'the last 2 weeks' : 'las últimas 2 semanas';
  return locale === 'en' ? 'this week' : 'esta semana';
}

function buildFallbackInsight(locale: 'es' | 'en', payload: PatternRequest): PatternResponse {
  const count = Math.max(0, Number(payload.checkInCount) || 0);
  const avg = Number(payload.avgEnergy) || 0;
  const top = payload.topEmotions?.[0];
  const period = periodName(locale, payload.period ?? 'week');

  const headline =
    locale === 'en' ? `What we notice about ${period}` : `Lo que notamos en ${period}`;

  const summary =
    count < 3
      ? locale === 'en'
        ? 'A few more check-ins and your pattern will read more clearly — no rush.'
        : 'Con unos check-ins más el patrón se verá más claro — sin prisa.'
      : locale === 'en'
        ? `You checked in ${count} times. ${top?.key ? `“${top.key}” appeared most often.` : 'Your days already form a gentle rhythm.'}`
        : `Registraste ${count} días. ${top?.key ? `«${top.key}» apareció con más frecuencia.` : 'Tus días ya forman un ritmo suave.'}`;

  const patternNote =
    avg >= 3.5
      ? locale === 'en'
        ? 'Energy stayed mostly steady — small steps may be enough on heavier days.'
        : 'La energía se mantuvo bastante estable — en días más pesados pueden bastar pasos pequeños.'
      : locale === 'en'
        ? 'Some days asked for more rest — honoring that is part of your pattern.'
        : 'Algunos días pidieron más descanso — honrar eso también es parte de tu patrón.';

  const gentleTip =
    locale === 'en'
      ? 'One minute in Hoy tomorrow counts. Koraa celebrates when you return — never when you miss.'
      : 'Un minuto en Hoy mañana cuenta. Koraa celebra cuando vuelves — nunca cuando falta.';

  return { headline, summary, patternNote, gentleTip };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildSystemPrompt(locale: 'es' | 'en'): string {
  if (locale === 'en') {
    return `You are Koraa, a calm emotional wellness companion. Explain check-in patterns warmly, without guilt or productivity pressure. Use plain language. Max 2 short sentences per field. Respond ONLY valid JSON: {"headline":"...","summary":"...","patternNote":"...","gentleTip":"..."}. headline: inviting title for the period. summary: what stands out emotionally. patternNote: one observed pattern (energy, weekday, emotion mix). gentleTip: one soft suggestion for tomorrow. Never mention streaks as obligation, productivity, or "you should".`;
  }
  return `Eres Koraa, acompañante de bienestar emocional. Explica patrones de check-in con calidez, sin culpa ni presión de productividad. Lenguaje claro. Máximo 2 frases cortas por campo. Responde SOLO JSON válido: {"headline":"...","summary":"...","patternNote":"...","gentleTip":"..."}. headline: título acogedor del periodo. summary: qué destaca emocionalmente. patternNote: un patrón observado (energía, día de semana, emociones). gentleTip: una sugerencia suave para mañana. Nunca uses racha como obligación, productividad ni "deberías".`;
}

async function callOpenAI(
  apiKey: string,
  locale: 'es' | 'en',
  payload: PatternRequest,
): Promise<{ insight: PatternResponse | null; openaiStatus?: number }> {
  const userContent = JSON.stringify(payload);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
      temperature: 0.65,
      max_tokens: 380,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(locale) },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    console.error('OpenAI error', res.status, (await res.text()).slice(0, 400));
    return { insight: null, openaiStatus: res.status };
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== 'string') return { insight: null };

  try {
    const parsed = JSON.parse(raw) as PatternResponse;
    if (
      typeof parsed.headline === 'string' &&
      typeof parsed.summary === 'string' &&
      typeof parsed.patternNote === 'string' &&
      typeof parsed.gentleTip === 'string'
    ) {
      return {
        insight: {
          headline: parsed.headline.trim().slice(0, 120),
          summary: parsed.summary.trim().slice(0, 320),
          patternNote: parsed.patternNote.trim().slice(0, 320),
          gentleTip: parsed.gentleTip.trim().slice(0, 280),
        },
      };
    }
  } catch {
    console.error('Invalid JSON from OpenAI');
  }
  return { insight: null };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY')?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let payload: PatternRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const locale = payload.locale === 'en' ? 'en' : 'es';

  if (!openaiKey) {
    const insight = buildFallbackInsight(locale, payload);
    return jsonResponse({ insight, source: 'fallback', code: 'AI_DISABLED' });
  }

  const { insight, openaiStatus } = await callOpenAI(openaiKey, locale, payload);
  if (!insight) {
    return jsonResponse({
      insight: buildFallbackInsight(locale, payload),
      source: 'fallback',
      code: 'AI_FAILED',
      openaiStatus,
    });
  }

  return jsonResponse({ insight, source: 'openai' });
});
