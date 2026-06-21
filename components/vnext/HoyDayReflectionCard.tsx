import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CalendarRange, ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { HoyStepBadge } from '@/components/hoy/HoyStepBadge';

type HoyDayReflectionCardProps = {
  onPress: () => void;
};

export function HoyDayReflectionCard({ onPress }: HoyDayReflectionCardProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('vnext.reorganizeCardCta')}
      accessibilityHint={t('vnext.reorganizeCardSub')}
      style={styles.touch}
    >
      <View style={styles.iconWrap}>
        <CalendarRange size={18} color={THEME.colors.calm.lavenderDeep} />
      </View>
      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <HoyStepBadge step={3} />
          <Text style={styles.title}>{t('vnext.reorganizeCardTitle')}</Text>
        </View>
        <Text style={styles.sub} numberOfLines={2}>
          {t('vnext.reorganizeCardSub')}
        </Text>
      </View>
      <ChevronRight size={20} color={THEME.colors.calm.lavenderDeep} strokeWidth={2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    minHeight: THEME.sizes.touchTarget,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.card,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderWidth: 1,
    borderColor: THEME.colors.tint.blue.border,
    ...THEME.shadows.soft,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
