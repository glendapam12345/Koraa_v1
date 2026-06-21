import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TaskFlexLevel } from '@/lib/lifeAreas/types';

type TaskFlexPillProps = {
  level: TaskFlexLevel;
};

const LEVEL_STYLE: Record<TaskFlexLevel, { bg: string; text: string }> = {
  suggested: {
    bg: THEME.colors.calm.lavender,
    text: THEME.colors.calm.lavenderDeep,
  },
  soon: {
    bg: THEME.colors.tint.blue.light,
    text: THEME.colors.gradient.blue,
  },
  flexible: {
    bg: THEME.colors.calm.mist,
    text: THEME.colors.text.secondary,
  },
};

export function TaskFlexPill({ level }: TaskFlexPillProps) {
  const { t } = useI18n();
  const palette = LEVEL_STYLE[level];

  return (
    <View style={[styles.wrap, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: palette.text }]}>
        {t(`tasksExperience.flex.${level}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: THEME.borderRadius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
  },
});
