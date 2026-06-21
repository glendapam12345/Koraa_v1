import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type ReorganizeWeekCtaProps = {
  onPress: () => void;
  compact?: boolean;
};

export function ReorganizeWeekCta({ onPress, compact = false }: ReorganizeWeekCtaProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={t('tasksExperience.reorganizeCtaA11y')}
      style={[styles.wrap, compact && styles.wrapCompact]}
    >
      <LinearGradient
        colors={[THEME.colors.calm.lavenderDeep, THEME.colors.gradient.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, compact && styles.gradientCompact]}
      >
        <Sparkles size={compact ? 18 : 20} color={THEME.colors.onGradient} />
        <Text style={[styles.label, compact && styles.labelCompact]}>
          {t('tasksExperience.reorganizeCta')}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: THEME.borderRadius.pill,
    overflow: 'hidden',
    ...THEME.shadows.soft,
  },
  wrapCompact: {
    alignSelf: 'flex-start',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: THEME.spacing.md,
    minHeight: THEME.sizes.touchTarget,
  },
  gradientCompact: {
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.sm + 4,
  },
  label: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
    lineHeight: 22,
  },
  labelCompact: {
    ...THEME.typography.small,
    lineHeight: 20,
  },
});
