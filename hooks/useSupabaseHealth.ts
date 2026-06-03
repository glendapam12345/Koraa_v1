import { useCallback, useEffect, useState } from 'react';
import { canReachSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getSupabaseConfigMismatch } from '@/lib/supabaseConfig';
import {
  checkSupabaseSchemaHealth,
  getPrimarySchemaIssue,
  type SchemaHealthIssue,
} from '@/lib/supabaseSchemaHealth';

export type SupabaseHealthStatus =
  | 'idle'
  | 'checking'
  | 'ok'
  | 'missing_config'
  | 'unreachable'
  | 'config_mismatch'
  | 'schema_incomplete';

export function useSupabaseHealth(userId: string | undefined) {
  const [status, setStatus] = useState<SupabaseHealthStatus>('idle');
  const [schemaIssues, setSchemaIssues] = useState<SchemaHealthIssue[]>([]);
  const [connectionDetail, setConnectionDetail] = useState<string | undefined>();

  const runCheck = useCallback(async () => {
    if (!userId) {
      setStatus('idle');
      setSchemaIssues([]);
      return;
    }

    if (!isSupabaseConfigured) {
      setStatus('missing_config');
      setSchemaIssues([]);
      return;
    }

    const mismatch = getSupabaseConfigMismatch();
    if (mismatch?.mismatched) {
      setStatus('config_mismatch');
      setSchemaIssues([]);
      setConnectionDetail(`${mismatch.envHost} vs ${mismatch.extraHost}`);
      return;
    }

    setStatus('checking');
    const reach = await canReachSupabase();
    if (!reach.ok) {
      setStatus('unreachable');
      setSchemaIssues([]);
      setConnectionDetail(reach.detail);
      return;
    }

    const schema = await checkSupabaseSchemaHealth();
    if (!schema.ok) {
      setStatus('schema_incomplete');
      setSchemaIssues(schema.issues);
      setConnectionDetail(undefined);
      return;
    }

    setStatus('ok');
    setSchemaIssues([]);
    setConnectionDetail(undefined);
  }, [userId]);

  useEffect(() => {
    void runCheck();
  }, [runCheck]);

  const primarySchemaIssue = getPrimarySchemaIssue(schemaIssues);

  return {
    status,
    schemaIssues,
    primarySchemaIssue,
    connectionDetail,
    refresh: runCheck,
  };
}
