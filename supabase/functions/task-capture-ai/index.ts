// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CaptureRequest = {
  locale?: 'es' | 'en';
  rawText?: string;
  today?: string;
  energyLevel?: number | null;
  emotionKey?: string | null;
  projects?: { id: string; name: string }[];
};

type ParsedTask = {
  content: string;
  scheduled_date: string | null;
  effort: 'light' | 'medium' | 'heavy' | null;
  project_id: string | null;
  estimated_minutes: number | null;
};

type CaptureResponse = {
  summary: string;
  main_task: ParsedTask;
  prep_steps: ParsedTask[];
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildSystemPrompt(locale: 'es' | 'en'): string {
  if (locale === 'en') {
    return `You parse natural-language task dumps for Koraa, a calm wellness app (not productivity guilt).
Given user text and today's date (YYYY-MM-DD), return JSON only:
{"summary":"one warm sentence","main_task":{"content":"short title","scheduled_date":"YYYY-MM-DD or null","effort":"light|medium|heavy|null","project_id":"uuid or null","estimated_minutes":number or null},"prep_steps":[{"content":"...","scheduled_date":"YYYY-MM-DD","effort":"light|medium|heavy|null","project_id":"uuid or null","estimated_minutes":number or null}]}
Rules:
- Extract due dates from phrases like "Friday", "tomorrow", "next Monday". Use the next matching calendar day on or after today.
- estimated_minutes: realistic duration in minutes (5–480, round to 5). Quick calls/emails 15–25; errands 30–45; presentations 60–90; video/reel editing 90–120; deep work 75–120. Use null only if truly unknown.
- main_task.content: clean task title, max 120 chars, no guilt language.
- prep_steps: 0-3 gentle preparation steps spread BEFORE the due date (only if due date is 2+ days away and task feels important). Never more than 3.
- If the user lists several DISTINCT tasks in one dump (commas, "and", newlines), put the first in main_task and each additional distinct task in prep_steps as its own independent task (not sub-steps of the same chore).
- effort heavy if user says important/urgent/anxious about deadline.
- summary: confirm what you understood, suggestive not imperative.
- projects: optional list {id, name} of the user's existing projects. Set project_id only when a task clearly belongs to one project (name in text or obvious match). Use only ids from that list; otherwise null. Never invent projects.
- scheduled_date must be null or valid ISO date.`;
  }
  return `Interpretas capturas en lenguaje natural para Koraa, app de bienestar (sin culpa ni productividad tóxica).
Con el texto de la usuaria y la fecha de hoy (AAAA-MM-DD), responde SOLO JSON:
{"summary":"una frase cálida","main_task":{"content":"título corto","scheduled_date":"AAAA-MM-DD o null","effort":"light|medium|heavy|null","project_id":"uuid o null","estimated_minutes":número o null},"prep_steps":[{"content":"...","scheduled_date":"AAAA-MM-DD","effort":"light|medium|heavy|null","project_id":"uuid o null","estimated_minutes":número o null}]}
Reglas:
- Extrae fechas: "el viernes", "mañana", "próximo lunes". Usa el próximo día calendario >= hoy.
- estimated_minutes: duración realista en minutos (5–480, redondea a 5). Llamadas/emails 15–25; recados 30–45; presentaciones 60–90; reel/video 90–120; trabajo profundo 75–120. null solo si no se puede estimar.
- main_task.content: título limpio, máx 120 caracteres, sin culpa.
- prep_steps: 0-3 pasos suaves de preparación ANTES de la fecha límite (solo si faltan 2+ días y la tarea parece importante). Máximo 3.
- Si el texto lista varias tareas DISTINTAS en un solo párrafo (comas, «y», saltos de línea), pon la primera en main_task y cada tarea adicional en prep_steps como tarea independiente (no subtareas de la misma).
- effort heavy si dice importante/urgente/ansiedad por la fecha.
- summary: confirma lo entendido, tono sugerente.
- projects: lista opcional {id, name} de proyectos existentes. Pon project_id solo si el paso encaja claramente con un proyecto (nombre en el texto o relación obvia). Solo ids de esa lista; si no, null. No inventes proyectos.
- scheduled_date null o fecha ISO válida.`;
}

async function callOpenAI(
  apiKey: string,
  locale: 'es' | 'en',
  payload: CaptureRequest,
): Promise<{ capture: CaptureResponse | null; openaiStatus?: number }> {
  const userContent = JSON.stringify({
    locale,
    rawText: payload.rawText ?? '',
    today: payload.today ?? '',
    energyLevel: payload.energyLevel ?? null,
    emotionKey: payload.emotionKey ?? null,
    projects: Array.isArray(payload.projects)
      ? payload.projects
          .filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string')
          .map((p) => ({ id: p.id, name: p.name.trim().slice(0, 80) }))
          .slice(0, 40)
      : [],
  });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 500,
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
    return { capture: null, openaiStatus: res.status };
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== 'string') return { capture: null };

  try {
    const parsed = JSON.parse(raw) as CaptureResponse;
    if (typeof parsed.summary !== 'string' || !parsed.main_task?.content) {
      return { capture: null };
    }
    return { capture: parsed };
  } catch {
    return { capture: null };
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

  let payload: CaptureRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const locale = payload.locale === 'en' ? 'en' : 'es';
  const rawText = (payload.rawText ?? '').trim();
  if (!rawText) {
    return jsonResponse({ error: 'rawText required' }, 400);
  }

  if (!openaiKey) {
    return jsonResponse({ capture: null, source: 'fallback', code: 'AI_DISABLED' });
  }

  const { capture, openaiStatus } = await callOpenAI(openaiKey, locale, payload);
  if (!capture) {
    return jsonResponse({
      capture: null,
      source: 'fallback',
      code: 'AI_FAILED',
      openaiStatus,
    });
  }

  return jsonResponse({ capture, source: 'openai' });
});
