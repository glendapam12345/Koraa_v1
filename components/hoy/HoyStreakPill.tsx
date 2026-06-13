import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyStreakPillProps = {
  streak: number;
  checkedInToday: boolean;
};

export function HoyStreakPill({ streak, checkedInToday }: HoyStreakPillProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      style={[styles.pill, checkedInToday && styles.pillActive]}
      onPress={() => router.push('/streak')}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('hoy.streakPillA11y', { count: streak })}
      accessibilityHint={t('hoy.streakPillHint')}
    >
      <Text style={styles.fire} accessibilityElementsHidden>
        🔥
      </Text>
      {streak > 0 ? (
        <Text style={[styles.count, checkedInToday && styles.countActive]}>{streak}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: THEME.sizes.touchTarget,
    minWidth: THEME.sizes.touchTarget,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
  },
  fire: {
    fontSize: 18,
    lineHeight: 22,
  },
  count: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    minWidth: 14,
    textAlign: 'center',
  },
  countActive: {
    color: THEME.colors.calm.lavenderDeep,
  },
});
