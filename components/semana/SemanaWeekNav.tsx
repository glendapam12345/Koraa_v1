import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type SemanaWeekNavProps = {
  label: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  prevA11yLabel: string;
  nextA11yLabel: string;
  /** Al tocar flechas bloqueadas (plan free) abre Premium. */
  onLockedNavPress?: () => void;
};

export function SemanaWeekNav({
  label,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  prevA11yLabel,
  nextA11yLabel,
  onLockedNavPress,
}: SemanaWeekNavProps) {
  const { t } = useI18n();
  const prevUnlocksPremium = !canGoPrev && !!onLockedNavPress;
  const nextUnlocksPremium = !canGoNext && !!onLockedNavPress;

  const handlePrev = () => {
    if (canGoPrev) {
      onPrev();
      return;
    }
    onLockedNavPress?.();
  };

  const handleNext = () => {
    if (canGoNext) {
      onNext();
      return;
    }
    onLockedNavPress?.();
  };

  return (
    <View style={styles.root}>
      <NavArrow
        direction="prev"
        enabled={canGoPrev}
        unlocksPremium={prevUnlocksPremium}
        onPress={handlePrev}
        accessibilityLabel={
          prevUnlocksPremium ? t('semana.rangeLockedA11y', { range: prevA11yLabel }) : prevA11yLabel
        }
        accessibilityHint={prevUnlocksPremium ? t('semana.navPremiumHint') : undefined}
      />

      <View style={styles.centerWrap}>
        <View style={[styles.center, THEME.surfaces.tinted]}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>

      <NavArrow
        direction="next"
        enabled={canGoNext}
        unlocksPremium={nextUnlocksPremium}
        onPress={handleNext}
        accessibilityLabel={
          nextUnlocksPremium ? t('semana.rangeLockedA11y', { range: nextA11yLabel }) : nextA11yLabel
        }
        accessibilityHint={nextUnlocksPremium ? t('semana.navPremiumHint') : undefined}
      />
    </View>
  );
}

function NavArrow({
  direction,
  enabled,
  unlocksPremium,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: {
  direction: 'prev' | 'next';
  enabled: boolean;
  unlocksPremium: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  const inactive = !enabled && !unlocksPremium;
  const color = unlocksPremium
    ? THEME.colors.calm.lavenderDeep
    : enabled
      ? THEME.colors.gradient.blue
      : THEME.colors.text.secondary;

  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        unlocksPremium && styles.iconButtonPremium,
        inactive && styles.iconButtonInactive,
      ]}
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {unlocksPremium ? <Lock size={10} color={THEME.colors.calm.lavenderDeep} /> : null}
      <Icon size={20} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 40,
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 0,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  iconButtonPremium: {
    backgroundColor: THEME.colors.calm.lavender,
    borderColor: THEME.colors.calm.lavenderDeep,
    gap: 1,
  },
  iconButtonInactive: {
    opacity: 0.4,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  center: {
    alignSelf: 'stretch',
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
});
