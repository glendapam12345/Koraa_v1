import { supabase, getSchemaSetupMessage, type SchemaSetupType } from '@/lib/supabase';

export type SchemaHealthIssue = SchemaSetupType;

export type SchemaHealthResult = {
  ok: boolean;
  issues: SchemaHealthIssue[];
};

type Probe = {
  issue: SchemaHealthIssue;
  run: () => Promise<{ error: unknown }>;
};

const PROBES: Probe[] = [
  {
    issue: 'schema',
    run: async () => {
      const { error } = await supabase.from('tasks').select('id').limit(0);
      return { error };
    },
  },
  {
    issue: 'project_id',
    run: async () => {
      const { error } = await supabase.from('tasks').select('id, project_id').limit(0);
      return { error };
    },
  },
  {
    issue: 'scheduled_date',
    run: async () => {
      const { error } = await supabase.from('tasks').select('id, scheduled_date').limit(0);
      return { error };
    },
  },
  {
    issue: 'schema',
    run: async () => {
      const { error } = await supabase.from('tasks').select('id, parent_task_id').limit(0);
      return { error };
    },
  },
  {
    issue: 'projects_table',
    run: async () => {
      const { error } = await supabase.from('projects').select('id').limit(0);
      return { error };
    },
  },
  {
    issue: 'schema',
    run: async () => {
      const { error } = await supabase.from('profiles').select('id, onboarding_completed').limit(0);
      return { error };
    },
  },
];

/**
 * Comprueba columnas/tablas mínimas en el proyecto remoto (requiere sesión para RLS).
 * Devuelve tipos de problema alineados con getSchemaSetupMessage / Semana / Tareas.
 */
export async function checkSupabaseSchemaHealth(): Promise<SchemaHealthResult> {
  const issues = new Set<SchemaHealthIssue>();

  for (const probe of PROBES) {
    try {
      const { error } = await probe.run();
      if (!error) continue;
      const mapped = getSchemaSetupMessage(error) ?? probe.issue;
      issues.add(mapped);
    } catch {
      issues.add(probe.issue);
    }
  }

  return {
    ok: issues.size === 0,
    issues: Array.from(issues),
  };
}

export function getPrimarySchemaIssue(issues: SchemaHealthIssue[]): SchemaHealthIssue | null {
  if (issues.length === 0) return null;
  const order: SchemaHealthIssue[] = [
    'projects_table',
    'project_id',
    'scheduled_date',
    'schema',
  ];
  for (const key of order) {
    if (issues.includes(key)) return key;
  }
  return issues[0];
}
