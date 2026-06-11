import { View, Text, StyleSheet } from 'react-native';
import { Crown } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { useI18n } from '@/contexts/I18nContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

type PremiumActiveBannerProps = {
  /** Contexto corto: p. ej. «En Para mí ya ves…» */
  contextLine?: string;
};

export function PremiumActiveBanner({ contextLine }: PremiumActiveBannerProps) {
  const { t } = useI18n();
  const { isDevPremiumSim } = useSubscription();

  return (
    <View accessibilityRole="summary">
      <CalmCard style={styles.card}>
      <View style={styles.header}>
        <Crown size={18} color={THEME.colors.calm.lavenderDeep} />
        <Text style={styles.title}>{t('premiumActive.title')}</Text>
      </View>
      {contextLine ? <Text style={styles.context}>{contextLine}</Text> : null}
      <Text style={styles.body}>
        {isDevPremiumSim ? t('settings.devPremiumActiveNote') : t('premiumActive.body')}
      </Text>
      </CalmCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.xs,
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderColor: THEME.colors.tint.blue.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  context: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  body: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
});
