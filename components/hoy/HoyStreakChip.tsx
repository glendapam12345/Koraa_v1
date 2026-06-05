import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Flame } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CHECK_IN_ROUTE } from '@/lib/checkInNavigation';
import { router } from 'expo-router';

type HoyStreakChipProps = {
  streak: number;
};

export function HoyStreakChip({ streak }: HoyStreakChipProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      style={styles.chip}
      onPress={() => (streak > 0 ? router.push('/(tabs)/parami') : router.push(CHECK_IN_ROUTE))}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={
        streak > 0
          ? t('hoyPlanFallback.streakA11y', { count: streak })
          : t('hoyExtra.noStreakA11y')
      }
    >
      <Flame size={18} color={THEME.colors.calm.lavenderDeep} />
      <Text style={styles.count}>{streak}</Text>
      <Text style={styles.label}>
        {streak === 1 ? t('yo.streakDayOne') : t('yo.streakDayMany')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: THEME.borderRadius.pill,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs + 2,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  count: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
});
