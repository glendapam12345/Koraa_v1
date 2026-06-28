// @ts-nocheck
/**
 * Orquestador Koraa (Fase 3b).
 * mode: `daily_brief` — coach + tips del día
 * mode: `weekly_brief` — narrativa suave de la semana (Semana)
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type BrainMode = 'daily_brief' | 'weekly_brief';

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

type TaskCandidate = {
  id: string;
  content: string;
  category: string;
  score?: number;
};

type WeeklyBriefPayload = {
  mode: 'weekly_brief';
  headline: string;
  summary: string;
  gentleAdvice: string;
  source: 'openai' | 'fallback';
  code?: string;
  openaiStatus?: number;
};

type WeekContext = {
  locale?: 'es' | 'en';
  displayName?: string;
  weekStart?: string;
  weekEnd?: string;
  totals?: {
    openTasks?: number;
    completedTasks?: number;
    checkInDays?: number;
    busiestDay?: string | null;
    busiestDayName?: string | null;
    busiestDayCount?: number;
  };
  today?: {
    emotionKey?: string;
    emotionLabel?: string;
    energyLevel?: number;
  };
  days?: Array<{
    date?: string;
    dayName?: string;
    openCount?: number;
    isToday?: boolean;
    checkIn?: {
      emotionKey?: string;
      emotionLabel?: string;
      energyLevel?: number;
    };
  }>;
};

type BrainRequest = {
  mode?: BrainMode;
  locale?: 'es' | 'en';
  context?: DayContext;
  tipCandidates?: TipCandidate[];
  taskCandidates?: TaskCandidate[];
  weekday?: string;
  weekContext?: WeekContext;
};

type CoachResponse = {
  greeting: string;
  body: string;
  actionLine: string;
};

type DailyBriefPayload = {
  mode: 'daily_brief';
  coach: CoachResponse;
  tipIds: string[];
  tipLead: string;
  focusTaskIds: string[];
  planHeadline: string;
  source: 'openai' | 'fallback';
  code?: string;
  openaiStatus?: number;
};

function resolveMaxFocus(energyLevel: number, emotionKey: string): number {
  const e = emotionKey.toLowerCase();
  if (energyLevel <= 2 || ['agotada', 'ansiosa', 'abrumada'].includes(e)) return 2;
  if (energyLevel === 3) return 3;
  if (energyLevel >= 4) return 5;
  return 4;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildFallbackBrief(
  locale: 'es' | 'en',
  payload: BrainRequest,
  tipCandidates: TipCandidate[],
  taskCandidates: TaskCandidate[],
): Omit<DailyBriefPayload, 'code' | 'openaiStatus'> {
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

  const tipIds = tipCandidates.slice(0, 3).map((tip) => tip.id);
  const tipLead =
    locale === 'en'
      ? 'A few gentle tips picked for how you feel today.'
      : 'Unos consejos suaves elegidos para cómo te sientes hoy.';

  const maxFocus = resolveMaxFocus(energyLevel, e);
  const focusTaskIds = taskCandidates.slice(0, maxFocus).map((task) => task.id);
  const planHeadline =
    locale === 'en'
      ? `Today: ${focusTaskIds.length > 0 ? `${focusTaskIds.length} gentle steps` : 'a calm pace'}.`
      : `Hoy: ${focusTaskIds.length > 0 ? `${focusTaskIds.length} pasos suaves` : 'un ritmo tranquilo'}.`;

  return {
    mode: 'daily_brief',
    coach: { greeting, body, actionLine },
    tipIds,
    tipLead,
    focusTaskIds,
    planHeadline,
    source: 'fallback',
  };
}

function buildSystemPrompt(locale: 'es' | 'en'): string {
  if (locale === 'en') {
    return `You are Koraa, the user's daily wellness brain. Tone: warm, decisive, never guilt-tripping. Respond ONLY with valid JSON:
{"coach":{"greeting":"...","body":"...","actionLine":"..."},"tipIds":["id1","id2"],"tipLead":"...","focusTaskIds":["t1","t2"],"planHeadline":"..."}
Rules:
- coach.greeting: first name + weekday
- coach.body: reflect emotion and energy 1-5 in one short sentence
- coach.actionLine: one clear gentle next move for today
- tipIds: exactly 2 or 3 ids ONLY from tipCandidates
- tipLead: one short sentence for tips
- focusTaskIds: pick 2-5 task ids ONLY from taskCandidates (fewer if low energy); order matters (first = start here)
- planHeadline: one motivating line summarizing today's focus (no productivity jargon)
Never invent ids. Never shame the user.`;
  }
  return `Eres Koraa, el cerebro diario de bienestar. Tono: cálido, claro, sin culpa. Responde SOLO JSON válido:
{"coach":{"greeting":"...","body":"...","actionLine":"..."},"tipIds":["id1","id2"],"tipLead":"...","focusTaskIds":["t1","t2"],"planHeadline":"..."}
Reglas:
- coach.greeting: nombre + día de la semana
- coach.body: emoción y energía 1-5 en una frase corta
- coach.actionLine: un siguiente paso claro y suave para hoy
- tipIds: exactamente 2 o 3 ids SOLO de tipCandidates
- tipLead: una frase corta para los consejos
- focusTaskIds: elige 2-5 ids SOLO de taskCandidates (menos si hay poca energía); el orden importa (el primero = empieza aquí)
- planHeadline: una línea que resuma el foco de hoy (sin jerga de productividad)
Nunca inventes ids. Nunca avergüences a la usuaria.`;
}

async function callOpenAI(
  apiKey: string,
  locale: 'es' | 'en',
  payload: BrainRequest,
  tipCandidates: TipCandidate[],
  taskCandidates: TaskCandidate[],
): Promise<{ brief: Omit<DailyBriefPayload, 'mode' | 'source'> | null; openaiStatus?: number }> {
  const userContent = JSON.stringify({
    locale,
    weekday: payload.weekday ?? '',
    context: payload.context ?? {},
    tipCandidates,
    taskCandidates,
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
      max_tokens: 480,
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
    const parsed = JSON.parse(raw) as {
      coach?: CoachResponse;
      tipIds?: string[];
      tipLead?: string;
      focusTaskIds?: string[];
      planHeadline?: string;
    };
    const validTipIds = new Set(tipCandidates.map((tip) => tip.id));
    const validTaskIds = new Set(taskCandidates.map((task) => task.id));
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
      .filter((id) => typeof id === 'string' && validTipIds.has(id))
      .slice(0, 3);

    const checkIn = payload.context?.checkIn ?? {};
    const energyLevel = Math.min(5, Math.max(1, Number(checkIn.energyLevel) || 3));
    const emotionKey = (checkIn.emotionKey ?? '').toLowerCase();
    const maxFocus = resolveMaxFocus(energyLevel, emotionKey);

    const focusTaskIds = (parsed.focusTaskIds ?? [])
      .filter((id) => typeof id === 'string' && validTaskIds.has(id))
      .slice(0, maxFocus);

    if (tipIds.length === 0 && focusTaskIds.length === 0) {
      return { brief: null };
    }

    return {
      brief: {
        coach: {
          greeting: coach.greeting.trim().slice(0, 200),
          body: coach.body.trim().slice(0, 280),
          actionLine: coach.actionLine.trim().slice(0, 280),
        },
        tipIds: tipIds.length > 0 ? tipIds : tipCandidates.slice(0, 2).map((tip) => tip.id),
        tipLead:
          typeof parsed.tipLead === 'string' && parsed.tipLead.trim()
            ? parsed.tipLead.trim().slice(0, 220)
            : locale === 'en'
              ? 'Gentle tips for how you feel today.'
              : 'Consejos suaves para cómo te sientes hoy.',
        focusTaskIds:
          focusTaskIds.length > 0
            ? focusTaskIds
            : taskCandidates.slice(0, maxFocus).map((task) => task.id),
        planHeadline:
          typeof parsed.planHeadline === 'string' && parsed.planHeadline.trim()
            ? parsed.planHeadline.trim().slice(0, 220)
            : locale === 'en'
              ? "Here's what matters today."
              : 'Esto es lo que importa hoy.',
      },
    };
  } catch {
    console.error('Invalid JSON from OpenAI');
    return { brief: null };
  }
}

async function handleDailyBrief(
  locale: 'es' | 'en',
  payload: BrainRequest,
  tipCandidates: TipCandidate[],
  taskCandidates: TaskCandidate[],
  openaiKey: string | undefined,
): Promise<DailyBriefPayload> {
  if (!openaiKey || (tipCandidates.length === 0 && taskCandidates.length === 0)) {
    return {
      ...buildFallbackBrief(locale, payload, tipCandidates, taskCandidates),
      code: openaiKey ? 'NO_CANDIDATES' : 'AI_DISABLED',
    };
  }

  const { brief, openaiStatus } = await callOpenAI(
    openaiKey,
    locale,
    payload,
    tipCandidates,
    taskCandidates,
  );
  if (!brief) {
    return {
      ...buildFallbackBrief(locale, payload, tipCandidates, taskCandidates),
      code: 'AI_FAILED',
      openaiStatus,
    };
  }

  return {
    mode: 'daily_brief',
    ...brief,
    source: 'openai',
  };
}

function buildFallbackWeeklyBrief(
  locale: 'es' | 'en',
  week: WeekContext,
): Omit<WeeklyBriefPayload, 'code' | 'openaiStatus'> {
  const totals = week.totals ?? {};
  const open = Math.max(0, Number(totals.openTasks) || 0);
  const completed = Math.max(0, Number(totals.completedTasks) || 0);
  const busiestName = (totals.busiestDayName ?? '').trim();
  const busiestCount = Math.max(0, Number(totals.busiestDayCount) || 0);
  const today = week.today;
  const lowEnergy = today && Number(today.energyLevel) <= 2;

  const headline = lowEnergy
    ? locale === 'en'
      ? 'Protect your energy this week'
      : 'Protege tu energía esta semana'
    : locale === 'en'
      ? 'Your week at a glance'
      : 'Tu semana de un vistazo';

  let summary =
    locale === 'en'
      ? open > 0
        ? `${open} open steps across the week — pace yourself.`
        : 'A light calendar — room to breathe.'
      : open > 0
        ? `${open} pasos abiertos en la semana — a tu ritmo.`
        : 'Calendario liviano — hay espacio para respirar.';

  if (completed > 0) {
    summary +=
      locale === 'en'
        ? ` You already closed ${completed} step${completed === 1 ? '' : 's'}.`
        : ` Ya cerraste ${completed} paso${completed === 1 ? '' : 's'}.`;
  }

  let gentleAdvice =
    locale === 'en'
      ? 'One step at a time; white space is allowed.'
      : 'Un paso a la vez; el espacio en blanco también vale.';

  if (lowEnergy) {
    gentleAdvice =
      locale === 'en'
        ? 'Fewer steps beat a perfect week — rest counts.'
        : 'Menos pasos ganan a una semana perfecta — descansar cuenta.';
  } else if (busiestName && busiestCount >= 4) {
    gentleAdvice =
      locale === 'en'
        ? `${busiestName} looks fuller — drag a card to a lighter day if it helps.`
        : `${busiestName} se ve más lleno — arrastra una tarjeta a un día más liviano si te ayuda.`;
  }

  return {
    mode: 'weekly_brief',
    headline,
    summary,
    gentleAdvice,
    source: 'fallback',
  };
}

function buildWeeklySystemPrompt(locale: 'es' | 'en'): string {
  if (locale === 'en') {
    return `You are Koraa, a gentle weekly wellness companion. Respond ONLY with valid JSON:
{"headline":"...","summary":"...","gentleAdvice":"..."}
Rules:
- headline: short, warm week theme (no productivity jargon)
- summary: 2 short sentences about the week ahead using weekContext (tasks per day, check-ins, energy)
- gentleAdvice: one actionable, guilt-free suggestion for the week
Never shame. Never say "priorities" or "productivity". Use "steps" not "tasks" when possible.`;
  }
  return `Eres Koraa, acompañante semanal de bienestar. Responde SOLO JSON válido:
{"headline":"...","summary":"...","gentleAdvice":"..."}
Reglas:
- headline: tema corto y cálido de la semana (sin jerga de productividad)
- summary: 2 frases cortas sobre la semana usando weekContext (pasos por día, check-ins, energía)
- gentleAdvice: una sugerencia concreta y sin culpa para la semana
Nunca avergüences. Evita "prioridades" o "productividad". Prefiere "pasos" en lugar de "tareas".`;
}

async function callOpenAIWeekly(
  apiKey: string,
  locale: 'es' | 'en',
  weekContext: WeekContext,
): Promise<{ brief: Omit<WeeklyBriefPayload, 'mode' | 'source'> | null; openaiStatus?: number }> {
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
        { role: 'system', content: buildWeeklySystemPrompt(locale) },
        { role: 'user', content: JSON.stringify({ locale, weekContext }) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('OpenAI weekly error', res.status, errText.slice(0, 400));
    return { brief: null, openaiStatus: res.status };
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== 'string') {
    return { brief: null };
  }

  try {
    const parsed = JSON.parse(raw) as {
      headline?: string;
      summary?: string;
      gentleAdvice?: string;
    };
    if (
      typeof parsed.headline !== 'string' ||
      typeof parsed.summary !== 'string' ||
      typeof parsed.gentleAdvice !== 'string'
    ) {
      return { brief: null };
    }

    return {
      brief: {
        headline: parsed.headline.trim().slice(0, 200),
        summary: parsed.summary.trim().slice(0, 400),
        gentleAdvice: parsed.gentleAdvice.trim().slice(0, 280),
      },
    };
  } catch {
    console.error('Invalid weekly JSON from OpenAI');
    return { brief: null };
  }
}

async function handleWeeklyBrief(
  locale: 'es' | 'en',
  weekContext: WeekContext,
  openaiKey: string | undefined,
): Promise<WeeklyBriefPayload> {
  if (!openaiKey) {
    return {
      ...buildFallbackWeeklyBrief(locale, weekContext),
      code: 'AI_DISABLED',
    };
  }

  const { brief, openaiStatus } = await callOpenAIWeekly(openaiKey, locale, weekContext);
  if (!brief) {
    return {
      ...buildFallbackWeeklyBrief(locale, weekContext),
      code: 'AI_FAILED',
      openaiStatus,
    };
  }

  return {
    mode: 'weekly_brief',
    ...brief,
    source: 'openai',
  };
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

  let payload: BrainRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const mode: BrainMode =
    payload.mode === 'weekly_brief'
      ? 'weekly_brief'
      : payload.mode === 'daily_brief'
        ? 'daily_brief'
        : 'daily_brief';

  if (
    payload.mode &&
    payload.mode !== 'daily_brief' &&
    payload.mode !== 'weekly_brief'
  ) {
    return jsonResponse({ error: 'Unsupported mode', mode: payload.mode }, 400);
  }

  const locale =
    payload.context?.locale === 'en' ||
    payload.locale === 'en' ||
    payload.weekContext?.locale === 'en'
      ? 'en'
      : 'es';

  if (mode === 'weekly_brief') {
    const weekContext = payload.weekContext ?? {};
    const result = await handleWeeklyBrief(locale, weekContext, openaiKey);
    return jsonResponse(result);
  }

  const tipCandidates = Array.isArray(payload.tipCandidates) ? payload.tipCandidates : [];
  const taskCandidates = Array.isArray(payload.taskCandidates) ? payload.taskCandidates : [];

  if (mode === 'daily_brief') {
    const result = await handleDailyBrief(
      locale,
      payload,
      tipCandidates,
      taskCandidates,
      openaiKey,
    );
    return jsonResponse(result);
  }

  return jsonResponse({ error: 'Unsupported mode' }, 400);
});
