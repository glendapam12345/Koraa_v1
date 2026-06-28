// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ReorganizeTaskInput = {
  id: string;
  content: string;
  project_id: string | null;
  scheduled_date: string | null;
  is_priority: boolean;
};

type ReorganizeRequest = {
  locale?: 'es' | 'en';
  reason?: string;
  today?: string;
  week_dates?: string[];
  week_context?: Record<string, unknown>;
  tasks?: ReorganizeTaskInput[];
  projects?: { id: string; name: string }[];
};

type Assignment = { id: string; scheduled_date: string };

type ReorganizeResponse = {
  headline: string;
  subline: string;
  moved: {
    taskId: string;
    title: string;
    areaEmoji: string;
    areaColor: string;
    fromLabel?: string;
    toLabel: string;
  }[];
  kept: {
    taskId: string;
    title: string;
    areaEmoji: string;
    areaColor: string;
  }[];
  freedHoursLabel?: string;
  assignments: Assignment[];
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildSystemPrompt(locale: 'es' | 'en'): string {
  if (locale === 'en') {
    return `You reorganize a gentle wellness task week for Koraa (anti-pressure, not productivity guilt).
Given: today (YYYY-MM-DD), week_dates (array of ISO dates), reason (what changed), open tasks, optional projects, optional week_context (check-ins, openCount per day, busiest day).
Return ONLY valid JSON:
{"headline":"...","subline":"...","moved":[{"taskId":"uuid","title":"...","areaEmoji":"...","areaColor":"#hex","fromLabel":"optional","toLabel":"weekday"}],"kept":[{"taskId":"uuid","title":"...","areaEmoji":"...","areaColor":"#hex"}],"freedHoursLabel":"2h or null","assignments":[{"id":"uuid","scheduled_date":"YYYY-MM-DD"}]}
Rules:
- Only assign tasks from the input list. scheduled_date must be in week_dates or today.
- reason new_event: protect today for the new event; move 1-3 flexible tasks later in the week.
- reason less_time/tired: spread load; keep 1-2 priority tasks on today max when tired.
- reason priorities_changed: pull is_priority tasks toward today; push others later.
- reason more_energy: pull 1-2 tasks from later days to today if gentle.
- reason week_balance: use week_context — move steps FROM the fullest day(s) TO lighter days; respect low energy today; keep is_priority near today max 2 if tired.
- moved/kept must match assignments logically. Warm brief Spanish/English copy in headline/subline.
- Never use productivity, guilt, or "priorities" pressure language.`;
  }
  return `Reorganizas la semana de tareas suaves en Koraa (sin presión ni culpa).
Entrada: today (AAAA-MM-DD), week_dates, reason (qué cambió), tareas abiertas, proyectos opcionales, week_context opcional (check-ins, openCount por día, día más lleno).
Responde SOLO JSON válido:
{"headline":"...","subline":"...","moved":[{"taskId":"uuid","title":"...","areaEmoji":"...","areaColor":"#hex","fromLabel":"opcional","toLabel":"día"}],"kept":[{"taskId":"uuid","title":"...","areaEmoji":"...","areaColor":"#hex"}],"freedHoursLabel":"2h o null","assignments":[{"id":"uuid","scheduled_date":"AAAA-MM-DD"}]}
Reglas:
- Solo tareas de la lista. scheduled_date en week_dates o today.
- new_event: deja espacio hoy; mueve 1-3 tareas flexibles más adelante.
- less_time/tired: reparte carga; si tired, máx 1-2 prioridades hoy.
- priorities_changed: acerca is_priority a hoy; empuja el resto.
- more_energy: trae 1-2 tareas de días posteriores a hoy si es suave.
- week_balance: usa week_context — mueve pasos DESDE el día más lleno HACIA días livianos; respeta poca energía hoy; is_priority cerca de hoy (máx 2 si tired).
- moved/kept coherentes con assignments. Tono cálido en headline/subline.
- Sin lenguaje de productividad ni culpa.`;
}

async function callOpenAI(
  apiKey: string,
  locale: 'es' | 'en',
  payload: ReorganizeRequest,
): Promise<{ plan: ReorganizeResponse | null; openaiStatus?: number }> {
  const userContent = JSON.stringify({
    locale,
    reason: payload.reason ?? 'less_time',
    today: payload.today ?? '',
    week_dates: payload.week_dates ?? [],
    week_context: payload.week_context ?? null,
    tasks: payload.tasks ?? [],
    projects: payload.projects ?? [],
  });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
      temperature: 0.5,
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(locale) },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    return { plan: null, openaiStatus: res.status };
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== 'string') return { plan: null };

  try {
    const parsed = JSON.parse(raw) as ReorganizeResponse;
    if (!Array.isArray(parsed.assignments) || !parsed.headline) return { plan: null };
    return { plan: parsed };
  } catch {
    return { plan: null };
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

  let payload: ReorganizeRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const locale = payload.locale === 'en' ? 'en' : 'es';

  if (!openaiKey) {
    return jsonResponse({ error: 'AI disabled', code: 'AI_DISABLED' }, 503);
  }

  const { plan, openaiStatus } = await callOpenAI(openaiKey, locale, payload);

  if (!plan) {
    return jsonResponse(
      { error: 'AI failed', code: 'AI_FAILED', openaiStatus: openaiStatus ?? null },
      502,
    );
  }

  return jsonResponse({ plan, source: 'ai' });
});
