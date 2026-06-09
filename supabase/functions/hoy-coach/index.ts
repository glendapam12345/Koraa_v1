// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CoachRequest = {
  locale?: 'es' | 'en';
  displayName?: string;
  emotionKey?: string;
  emotionLabel?: string;
  energyLevel?: number;
  suggestion?: string;
  focusCount?: number;
  weekday?: string;
};

type CoachResponse = {
  greeting: string;
  body: string;
  actionLine: string;
};

function buildFallbackCoach(locale: 'es' | 'en', payload: CoachRequest): CoachResponse {
  const displayName = (payload.displayName ?? '').trim() || (locale === 'en' ? 'there' : 'amiga');
  const emotionLabel = (payload.emotionLabel ?? '').trim() || (locale === 'en' ? 'steady' : 'constante');
  const energyLevel = Math.min(5, Math.max(1, Number(payload.energyLevel) || 3));
  const focusCount = Math.max(0, Number(payload.focusCount) || 0);
  const suggestion = (payload.suggestion ?? '').trim();
  const weekday =
    (payload.weekday ?? '').trim() ||
    new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { weekday: 'long' });
  const e = (payload.emotionKey ?? '').toLowerCase();

  const greeting =
    locale === 'en'
      ? `${displayName}, today is ${weekday}`
      : `${displayName}, hoy es ${weekday}`;

  const body =
    locale === 'en'
      ? `You're feeling ${emotionLabel.toLowerCase()} (energy ${energyLevel}/5).`
      : `Te sientes ${emotionLabel.toLowerCase()} · energía ${energyLevel}/5.`;

  let actionLine = suggestion;
  if (!actionLine) {
    if (energyLevel <= 2 || ['agotada', 'ansiosa', 'abrumada'].includes(e)) {
      actionLine =
        locale === 'en'
          ? 'One gentle step and short breaks — no need to push.'
          : 'Un paso suave y pausas cortas; no hace falta forzar.';
    } else if (energyLevel >= 4) {
      actionLine =
        locale === 'en'
          ? `Good energy today — ${focusCount > 0 ? 'start with the first suggested step' : 'capture tasks, then check in on Today'}.`
          : `Buena energía hoy — ${focusCount > 0 ? 'empieza por el primer paso sugerido' : 'anota pendientes y haz check-in en Hoy'}.`;
    } else {
      actionLine =
        locale === 'en'
          ? 'Steady pace: 2–3 suggested steps may be enough for today.'
          : 'Ritmo constante: con 2–3 pasos sugeridos puede bastar hoy.';
    }
  } else {
    const prefix = locale === 'en' ? 'We suggest: ' : 'Te recomendamos: ';
    actionLine = prefix + actionLine;
  }

  return { greeting, body, actionLine };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildSystemPrompt(locale: 'es' | 'en'): string {
  if (locale === 'en') {
    return `You are Koraa, a calm wellness coach for a task app. Tone: warm, brief, never pushy or guilt-inducing. No sarcasm. Max 1 short sentence per field. Respond ONLY with valid JSON: {"greeting":"...","body":"...","actionLine":"..."}. greeting: use their first name + weekday. body: reflect emotion and energy 1-5. actionLine: one gentle recommendation (can mention suggested steps count). Never use productivity, focus tasks, or guilt language.`;
  }
  return `Eres Koraa, coach de bienestar en una app de tareas. Tono: cálido, breve, sin presión ni culpa. Sin sarcasmo. Máximo 1 frase corta por campo. Responde SOLO JSON válido: {"greeting":"...","body":"...","actionLine":"..."}. greeting: nombre + día de la semana. body: emoción y energía 1-5. actionLine: una recomendación suave (puede mencionar pasos sugeridos). Nunca uses productividad, focos ni culpa.`;
}

async function callOpenAI(
  apiKey: string,
  locale: 'es' | 'en',
  payload: CoachRequest,
): Promise<{ coach: CoachResponse | null; openaiStatus?: number; openaiError?: string }> {
  const userContent = JSON.stringify({
    locale,
    displayName: payload.displayName ?? '',
    emotionKey: payload.emotionKey ?? '',
    emotionLabel: payload.emotionLabel ?? '',
    energyLevel: payload.energyLevel ?? 3,
    suggestion: payload.suggestion ?? '',
    focusCount: payload.focusCount ?? 0,
    weekday: payload.weekday ?? '',
  });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 220,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(locale) },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('OpenAI error', res.status, errText.slice(0, 400));
    return { coach: null, openaiStatus: res.status, openaiError: errText.slice(0, 200) };
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== 'string') {
    return { coach: null, openaiError: 'empty_completion' };
  }

  try {
    const parsed = JSON.parse(raw) as CoachResponse;
    if (
      typeof parsed.greeting === 'string' &&
      typeof parsed.body === 'string' &&
      typeof parsed.actionLine === 'string'
    ) {
      return {
        coach: {
          greeting: parsed.greeting.trim().slice(0, 200),
          body: parsed.body.trim().slice(0, 280),
          actionLine: parsed.actionLine.trim().slice(0, 280),
        },
      };
    }
  } catch {
    console.error('Invalid JSON from OpenAI');
  }
  return { coach: null, openaiError: 'invalid_json' };
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

  let payload: CoachRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const locale = payload.locale === 'en' ? 'en' : 'es';

  if (!openaiKey) {
    const coach = buildFallbackCoach(locale, payload);
    return jsonResponse({ coach, source: 'fallback', code: 'AI_DISABLED' });
  }

  const { coach, openaiStatus, openaiError } = await callOpenAI(openaiKey, locale, payload);
  if (!coach) {
    console.warn('OpenAI fallback', { openaiStatus, openaiError });
    const fallback = buildFallbackCoach(locale, payload);
    return jsonResponse({
      coach: fallback,
      source: 'fallback',
      code: 'AI_FAILED',
      openaiStatus,
    });
  }

  return jsonResponse({ coach, source: 'openai' });
});
