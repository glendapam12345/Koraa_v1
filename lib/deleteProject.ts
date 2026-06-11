import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { TranslationKey } from '@/lib/i18n';

type TranslateFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

export async function deleteProjectById(
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: unknown }> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) return { ok: false, error };
  return { ok: true };
}

export function confirmDeleteProject(
  t: TranslateFn,
  projectName: string,
  onConfirm: () => void | Promise<void>,
): void {
  Alert.alert(
    t('projects.deleteProjectTitle'),
    t('projects.deleteProjectBody', { name: projectName }),
    [
      { text: t('errors.cancel'), style: 'cancel' },
      {
        text: t('errors.delete'),
        style: 'destructive',
        onPress: () => {
          void onConfirm();
        },
      },
    ],
  );
}
