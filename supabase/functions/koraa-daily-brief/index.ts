// @ts-nocheck
/** @deprecated Client uses `koraa-brain` (mode: daily_brief). Kept for backward compatibility. */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type TipCandidate = {
  id: string;
  category: string;
  title: string;
};

type DayContext = {
  locale?: 'es' | 'en';
  date?: string;
  displayName?: string;
  checkIn?: {
    emotionKey?: string;
    emotionLabel?: string;
    energyLevel?: number;
    availableTime?: string;
    focusLevel?: string;
  };
  plan?: {
    suggestion?: string;
    focusCount?: number;
    focusTasks?: { id: string; content: string }[];
    pendingCount?: number;
  };
};

type BriefRequest = {
  locale?: 'es' | 'en';
  context?: DayContext;
  tipCandidates?: TipCandidate[];
  weekday?: string;
};

type CoachResponse = {
  greeting: string;
  body: string;
  actionLine: string;
};

type BriefResponse = {
  coach: CoachResponse;
  tipIds: string[];
  tipLead: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildFallbackBrief(
  locale: 'es' | 'en',
  payload: BriefRequest,
  candidates: TipCandidate[],
): BriefResponse {
  const ctx = payload.context ?? {};
  const checkIn = ctx.checkIn ?? {};
  const plan = ctx.plan ?? {};
  const displayName =
    (ctx.displayName ?? '').trim() || (locale === 'en' ? 'there' : 'amiga');
  const emotionLabel =
    (checkIn.emotionLabel ?? '').trim() || (locale === 'en' ? 'steady' : 'constante');
  const energyLevel = Math.min(5, Math.max(1, Number(checkIn.energyLevel) || 3));
  const focusCount = Math.max(0, Number(plan.focusCount) || 0);
  const suggestion = (plan.suggestion ?? '').trim();
  const weekday =
    (payload.weekday ?? '').trim() ||
    new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { weekday: 'long' });
  const e = (checkIn.emotionKey ?? '').toLowerCase();

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
  }

  const tipIds = candidates.slice(0, 3).map((tip) => tip.id);
  const tipLead =
    locale === 'en'
      ? 'A few gentle tips picked for how you feel today.'
      : 'Unos consejos suaves elegidos para cómo te sientes hoy.';

  return { coach: { greeting, body, actionLine }, tipIds, tipLead };
}

function buildSystemPrompt(locale: 'es' | 'en'): string {
  if (locale === 'en') {
    return `You are Koraa, a calm wellness coach. Tone: warm, brief, never pushy. Respond ONLY with valid JSON:
{"coach":{"greeting":"...","body":"...","actionLine":"..."},"tipIds":["id1","id2"],"tipLead":"..."}
Rules:
- coach.greeting: first name + weekday
- coach.body: reflect emotion and energy 1-5 in one short sentence
- coach.actionLine: one gentle recommendation aligned with suggested steps (no guilt)
- tipIds: pick exactly 2 or 3 ids ONLY from tipCandidates (never invent ids)
- tipLead: one short sentence introducing the tips for today
Never use productivity pressure language.`;
  }
  return `Eres Koraa, coach de bienestar. Tono: cálido, breve, sin presión. Responde SOLO JSON válido:
{"coach":{"greeting":"...","body":"...","actionLine":"..."},"tipIds":["id1","id2"],"tipLead":"..."}
Reglas:
- coach.greeting: nombre + día de la semana
- coach.body: emoción y energía 1-5 en una frase corta
- coach.actionLine: recomendación suave alineada con los pasos sugeridos (sin culpa)
- tipIds: elige exactamente 2 o 3 ids SOLO de tipCandidates (nunca inventes ids)
- tipLead: una frase corta que presente los consejos de hoy
Nunca uses lenguaje de productividad rígida.`;
}

async function callOpenAI(
  apiKey: string,
  locale: 'es' | 'en',
  payload: BriefRequest,
  candidates: TipCandidate[],
): Promise<{ brief: BriefResponse | null; openaiStatus?: number }> {
  const userContent = JSON.stringify({
    locale,
    weekday: payload.weekday ?? '',
    context: payload.context ?? {},
    tipCandidates: candidates,
  });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
      temperature: 0.65,
      max_tokens: 320,
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
    return { brief: null, openaiStatus: res.status };
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== 'string') {
    return { brief: null };
  }

  try {
    const parsed = JSON.parse(raw) as BriefResponse;
    const validIds = new Set(candidates.map((tip) => tip.id));
    const coach = parsed.coach;
    if (
      !coach ||
      typeof coach.greeting !== 'string' ||
      typeof coach.body !== 'string' ||
      typeof coach.actionLine !== 'string'
    ) {
      return { brief: null };
    }

    const tipIds = (parsed.tipIds ?? [])
      .filter((id) => typeof id === 'string' && validIds.has(id))
      .slice(0, 3);

    if (tipIds.length === 0) {
      return { brief: null };
    }

    return {
      brief: {
        coach: {
          greeting: coach.greeting.trim().slice(0, 200),
          body: coach.body.trim().slice(0, 280),
          actionLine: coach.actionLine.trim().slice(0, 280),
        },
        tipIds,
        tipLead:
          typeof parsed.tipLead === 'string' && parsed.tipLead.trim()
            ? parsed.tipLead.trim().slice(0, 220)
            : locale === 'en'
              ? 'Gentle tips for how you feel today.'
              : 'Consejos suaves para cómo te sientes hoy.',
      },
    };
  } catch {
    console.error('Invalid JSON from OpenAI');
    return { brief: null };
  }
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

  let payload: BriefRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const locale =
    payload.context?.locale === 'en' || payload.locale === 'en' ? 'en' : 'es';
  const candidates = Array.isArray(payload.tipCandidates) ? payload.tipCandidates : [];

  if (!openaiKey || candidates.length === 0) {
    const fallback = buildFallbackBrief(locale, payload, candidates);
    return jsonResponse({
      ...fallback,
      source: 'fallback',
      code: openaiKey ? 'NO_CANDIDATES' : 'AI_DISABLED',
    });
  }

  const { brief, openaiStatus } = await callOpenAI(openaiKey, locale, payload, candidates);
  if (!brief) {
    const fallback = buildFallbackBrief(locale, payload, candidates);
    return jsonResponse({
      ...fallback,
      source: 'fallback',
      code: 'AI_FAILED',
      openaiStatus,
    });
  }

  return jsonResponse({ ...brief, source: 'openai' });
});
