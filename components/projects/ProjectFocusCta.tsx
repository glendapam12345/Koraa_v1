import { useState } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { goToHoyTab } from '@/lib/tabNavigation';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { focusProjectForToday } from '@/lib/projectFocus';

type ProjectFocusCtaProps = {
  userId: string;
  projectId: string;
  projectName: string;
  incompleteCount: number;
  onFocused?: () => void;
};

const UI_ACCENT = THEME.colors.calm.lavenderDeep;

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
            text: t('projects.focusGoHoy'),
            onPress: () => goToHoyTab(),
          },
          {
            text: t('projects.focusGoOrganized'),
            onPress: () => router.push('/(tabs)/vaciar?segment=projects'),
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => void handlePress()}
      disabled={loading}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={t('projects.focusCtaA11y', { name: projectName })}
      accessibilityState={{ busy: loading }}
    >
      <View style={styles.iconWrap}>
        {loading ? (
          <ActivityIndicator size="small" color={UI_ACCENT} />
        ) : (
          <Sparkles size={20} color={UI_ACCENT} strokeWidth={2} />
        )}
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{t('projects.focusCta')}</Text>
        <Text style={styles.hint}>{t('projects.focusCtaHint', { name: projectName })}</Text>
      </View>
      {!loading ? <ChevronRight size={20} color={UI_ACCENT} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    minHeight: THEME.sizes.touchTarget,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  hint: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
});
