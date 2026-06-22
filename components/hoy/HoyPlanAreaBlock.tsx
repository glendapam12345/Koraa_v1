import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { ResolvedLifeArea } from '@/lib/lifeAreas/userLifeAreas';

type HoyPlanAreaBlockProps = {
  area: ResolvedLifeArea;
  stepCount: number;
  children: ReactNode;
};

export function HoyPlanAreaBlock({ area, stepCount, children }: HoyPlanAreaBlockProps) {
  const { t } = useI18n();

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji} accessibilityElementsHidden>
            {area.emoji}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {area.name}
          </Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>
            {stepCount === 1 ? t('hoy.planAreaOneStep') : t('hoy.planAreaSteps', { count: stepCount })}
          </Text>
        </View>
      </View>
      <View style={styles.tasks}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: THEME.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
    paddingHorizontal: 2,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  emoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flexShrink: 1,
    lineHeight: 18,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  countText: {
    ...THEME.typography.micro,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
    lineHeight: 14,
  },
  tasks: {
    gap: THEME.spacing.sm,
  },
});
