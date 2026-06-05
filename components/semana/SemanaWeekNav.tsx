import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
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
};

export function SemanaWeekNav({
  label,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  prevA11yLabel,
  nextA11yLabel,
}: SemanaWeekNavProps) {
  const { t } = useI18n();

  return (
    <View style={styles.root}>
      <TouchableOpacity
        style={[styles.button, !canGoPrev && styles.buttonDisabled]}
        onPress={onPrev}
        disabled={!canGoPrev}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={prevA11yLabel}
      >
        <ChevronLeft
          size={22}
          color={canGoPrev ? THEME.colors.gradient.blue : THEME.colors.text.secondary}
        />
        <Text style={[styles.buttonText, !canGoPrev && styles.buttonTextDisabled]}>{t('semana.prev')}</Text>
      </TouchableOpacity>

      <View style={styles.centerWrap}>
        <View style={[styles.center, THEME.surfaces.tinted]}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, !canGoNext && styles.buttonDisabled]}
        onPress={onNext}
        disabled={!canGoNext}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={nextA11yLabel}
      >
        <Text style={[styles.buttonText, !canGoNext && styles.buttonTextDisabled]}>{t('semana.next')}</Text>
        <ChevronRight
          size={22}
          color={canGoNext ? THEME.colors.gradient.blue : THEME.colors.text.secondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    gap: THEME.spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    minWidth: 90,
    maxWidth: 100,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.medium,
  },
  buttonTextDisabled: {
    color: THEME.colors.text.secondary,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  center: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    fontSize: 13,
  },
});
