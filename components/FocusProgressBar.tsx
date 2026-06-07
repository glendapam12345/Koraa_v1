import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

export type FocusProgressStats = {
  done: number;
  total: number;
  ratio: number;
};

type FocusProgressBarProps = {
  stats: FocusProgressStats;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'prominent';
};

export function FocusProgressBar({
  stats,
  style,
  variant = 'default',
}: FocusProgressBarProps) {
  const { t } = useI18n();
  const { done, total, ratio } = stats;
  const prominent = variant === 'prominent';

  if (total <= 0) return null;

  const headingKey: TranslationKey =
    done >= total
      ? 'hoy.focusProgressAllDone'
      : done === 0
        ? 'hoy.focusProgressStart'
        : 'hoy.focusProgressHeading';

  return (
    <View
      style={[styles.block, prominent && styles.blockProminent, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={t('hoy.focusProgressA11y', { done, total })}
      accessibilityValue={{ min: 0, max: total, now: done }}
    >
      <Text style={[styles.label, prominent && styles.labelProminent]}>
        {t(headingKey, { done, total })}
      </Text>
      <View style={[styles.track, prominent && styles.trackProminent]}>
        <LinearGradient
          colors={[THEME.colors.calm.lavenderDeep, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${Math.max(ratio * 100, done > 0 ? 8 : 4)}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 6,
  },
  blockProminent: {
    gap: THEME.spacing.xs,
    ...THEME.surfaces.panel,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.rounded,
  },
  label: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  labelProminent: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  track: {
    height: 6,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    overflow: 'hidden',
  },
  trackProminent: {
    height: 10,
  },
  fill: {
    height: '100%',
    borderRadius: THEME.borderRadius.pill,
    minWidth: 6,
  },
});
