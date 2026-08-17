import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyStreakPillProps = {
  streak: number;
  checkedInToday: boolean;
  /** Ritmo sostenido con un día libre — tono más suave, sin culpa. */
  softGrace?: boolean;
};

export function HoyStreakPill({
  streak,
  checkedInToday,
  softGrace = false,
}: HoyStreakPillProps) {
  const { t } = useI18n();
  const soft = softGrace && streak > 0 && !checkedInToday;

  return (
    <TouchableOpacity
      style={[
        styles.pill,
        checkedInToday && styles.pillActive,
        soft && styles.pillSoft,
      ]}
      onPress={() => router.push('/streak')}
      delayPressIn={0}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={
        soft
          ? t('hoy.streakPillGraceA11y', { count: streak })
          : t('hoy.streakPillA11y', { count: streak })
      }
      accessibilityHint={t('hoy.streakPillHint')}
    >
      {soft ? (
        <View accessibilityElementsHidden>
          <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} strokeWidth={2} />
        </View>
      ) : (
        <Text style={styles.fire} accessibilityElementsHidden>
          🔥
        </Text>
      )}
      {streak > 0 ? (
        <Text
          style={[
            styles.count,
            checkedInToday && styles.countActive,
            soft && styles.countSoft,
          ]}
        >
          {streak}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: THEME.sizes.touchTarget,
    minWidth: THEME.sizes.touchTarget,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: THEME.colors.calm.blush,
    borderColor: THEME.colors.calm.lavenderDeep,
  },
  pillSoft: {
    backgroundColor: THEME.colors.tint.blue.soft,
    borderColor: THEME.colors.tint.blue.border,
  },
  fire: {
    fontSize: 16,
    lineHeight: 20,
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
  countSoft: {
    color: THEME.colors.calm.lavenderDeep,
  },
});
