import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, RefreshCw } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';

type HoyUpdateFeelCardProps = {
  onPress: () => void;
};

export function HoyUpdateFeelCard({ onPress }: HoyUpdateFeelCardProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={t('hoy.focusUpdateCheckInCta')}
      accessibilityHint={t('hoy.focusUpdateCheckInA11y')}
    >
      <CalmCard style={styles.card}>
        <View style={styles.iconWrap}>
          <RefreshCw size={18} color={THEME.colors.calm.lavenderDeep} />
        </View>
        <Text style={styles.label} numberOfLines={2}>
          {t('hoy.focusUpdateCheckInQuestion')}{' '}
          <Text style={styles.action}>{t('hoy.focusUpdateCheckInAction')}</Text>
        </Text>
        <ChevronRight size={18} color={THEME.colors.calm.lavenderDeep} />
      </CalmCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.sm,
    borderColor: THEME.colors.calm.lavender,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.calm.mist,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    flexShrink: 0,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 20,
  },
  action: {
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
});
