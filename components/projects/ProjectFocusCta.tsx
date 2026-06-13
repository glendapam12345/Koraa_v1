import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useI18n } from '@/contexts/I18nContext';
import { focusProjectForToday } from '@/lib/projectFocus';

type ProjectFocusCtaProps = {
  userId: string;
  projectId: string;
  projectName: string;
  incompleteCount: number;
  onFocused?: () => void;
};

/** Prioriza pasos del proyecto con IA y lleva a Tareas. */
export function ProjectFocusCta({
  userId,
  projectId,
  projectName,
  incompleteCount,
  onFocused,
}: ProjectFocusCtaProps) {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(false);

  if (incompleteCount <= 0) return null;

  const handlePress = async () => {
    setLoading(true);
    try {
      const result = await focusProjectForToday({
        userId,
        projectId,
        projectName,
        locale,
      });

      if (!result.ok) {
        if (result.reason === 'no_tasks') {
          Alert.alert(t('projects.focusNoTasksTitle'), t('projects.focusNoTasksBody'));
        } else {
          Alert.alert(t('projects.focusCta'), t('projects.focusErrorBody'));
        }
        return;
      }

      onFocused?.();
      Alert.alert(
        t('projects.focusSuccessTitle'),
        t('projects.focusSuccessBody', {
          count: result.prioritizedCount,
          name: result.projectName,
        }),
        [
          {
            text: t('projects.focusGoTasks'),
            onPress: () => router.push('/(tabs)/vaciar'),
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <CalmPrimaryButton
      label={t('projects.focusCta')}
      onPress={() => void handlePress()}
      loading={loading}
      variant="soft"
      accessibilityLabel={t('projects.focusCtaA11y', { name: projectName })}
    />
  );
}
