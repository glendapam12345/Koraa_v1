import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

export type FocusProgressStats = {
  done: number;
  total: number;
  ratio: number;
};

type FocusProgressBarProps = {
  stats: FocusProgressStats;
  style?: StyleProp<ViewStyle>;
};

export function FocusProgressBar({ stats, style }: FocusProgressBarProps) {
  const { t } = useI18n();
  const { done, total, ratio } = stats;

  if (total <= 0) return null;

  return (
    <View
      style={[styles.block, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={t('hoy.focusProgressA11y', { done, total })}
      accessibilityValue={{ min: 0, max: total, now: done }}
    >
      <Text style={styles.label}>{t('hoy.focusProgress', { done, total })}</Text>
      <View style={styles.track}>
        <LinearGradient
          colors={[THEME.colors.gradient.blue, THEME.colors.gradient.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${Math.max(ratio * 100, 4)}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 6,
  },
  label: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  track: {
    height: 6,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[200],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: THEME.borderRadius.pill,
    minWidth: 6,
  },
});
