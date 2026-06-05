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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildSystemPrompt(locale: 'es' | 'en'): string {
  if (locale === 'en') {
    return `You are Koraa, a calm wellness coach for a task app. Tone: warm, brief, never pushy or guilt-inducing. No sarcasm. Max 1 short sentence per field. Respond ONLY with valid JSON: {"greeting":"...","body":"...","actionLine":"..."}. greeting: use their first name + weekday. body: reflect emotion and energy 1-5. actionLine: one gentle recommendation (can mention focus tasks count).`;
  }
  return `Eres Koraa, coach de bienestar en una app de tareas. Tono: cálido, breve, sin presión ni culpa. Sin sarcasmo. Máximo 1 frase corta por campo. Responde SOLO JSON válido: {"greeting":"...","body":"...","actionLine":"..."}. greeting: nombre + día de la semana. body: emoción y energía 1-5. actionLine: una recomendación suave (puede mencionar focos del día).`;
}

async function callOpenAI(
  apiKey: string,
  locale: 'es' | 'en',
  payload: CoachRequest,
): Promise<CoachResponse | null> {
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
    return null;
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== 'string') return null;

  try {
    const parsed = JSON.parse(raw) as CoachResponse;
    if (
      typeof parsed.greeting === 'string' &&
      typeof parsed.body === 'string' &&
      typeof parsed.actionLine === 'string'
    ) {
      return {
        greeting: parsed.greeting.trim().slice(0, 200),
        body: parsed.body.trim().slice(0, 280),
        actionLine: parsed.actionLine.trim().slice(0, 280),
      };
    }
  } catch {
    console.error('Invalid JSON from OpenAI');
  }
  return null;
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
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }

  if (!openaiKey) {
    return jsonResponse({ error: 'AI not configured', code: 'AI_DISABLED' }, 503);
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

  const coach = await callOpenAI(openaiKey, locale, payload);
  if (!coach) {
    return jsonResponse({ error: 'AI generation failed', code: 'AI_FAILED' }, 502);
  }

  return jsonResponse({ coach, source: 'openai' });
});
