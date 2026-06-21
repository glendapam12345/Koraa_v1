import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CalendarRange, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';

type HoyLightenLoadCardProps = {
  onPress: () => void;
  /** Más énfasis visual cuando el check-in indica sobrecarga. */
  emphasized?: boolean;
};

export function HoyLightenLoadCard({ onPress, emphasized = false }: HoyLightenLoadCardProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('hoy.lightenLoad')}
      accessibilityHint={t('hoy.focusLightenA11y')}
      style={[styles.touch, emphasized && styles.touchEmphasized]}
    >
      <View style={[styles.iconWrap, emphasized && styles.iconWrapEmphasized]}>
        <CalendarRange
          size={22}
          color={emphasized ? THEME.colors.gradient.pink : THEME.colors.gradient.blue}
          strokeWidth={2}
        />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{t('hoy.lightenLoad')}</Text>
        <Text style={styles.sub}>{t('hoy.lightenLoadSub')}</Text>
      </View>
      <ChevronRight size={22} color={THEME.colors.calm.lavenderDeep} strokeWidth={2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget + 8,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.card,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    ...THEME.shadows.soft,
  },
  touchEmphasized: {
    backgroundColor: THEME.colors.tint.pink.soft,
    borderColor: THEME.colors.gradient.pink,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.standard + 2,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapEmphasized: {
    backgroundColor: THEME.colors.calm.card,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    flex: 1,
  },
  sub: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
});
