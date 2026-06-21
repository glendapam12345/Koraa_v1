import { View, Text, StyleSheet } from 'react-native';
import { Check, Crown, Lock } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { useI18n } from '@/contexts/I18nContext';

type PaywallComparisonCardProps = {
  /** Cuando ya tiene Premium, la columna derecha muestra checks en lugar de candados. */
  isSubscribed?: boolean;
};

/** Tabla gratis vs Premium — alinea promesa del paywall con lo que desbloquea la app. */
export function PaywallComparisonCard({ isSubscribed = false }: PaywallComparisonCardProps) {
  const { t } = useI18n();

  const freeItems = [t('paywall.free1'), t('paywall.free2'), t('paywall.free3')] as const;
  const premiumItems = [t('paywall.locked1'), t('paywall.locked2'), t('paywall.locked3')] as const;

  return (
    <CalmCard style={styles.card}>
      <Text style={styles.title}>{t('paywall.comparisonTitle')}</Text>

      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.columnLabel}>{t('paywall.comparisonFreeLabel')}</Text>
          <View style={styles.items}>
            {freeItems.map((label) => (
              <View key={label} style={styles.row}>
                <Check size={15} color={THEME.colors.text.secondary} />
                <Text style={styles.freeText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.columnDivider} />

        <View style={[styles.column, styles.premiumColumn]}>
          <View style={styles.premiumHeader}>
            <Crown size={14} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.premiumLabel}>
              {isSubscribed ? t('paywall.comparisonActiveTitle') : t('paywall.comparisonPremiumTitle')}
            </Text>
          </View>
          <View style={styles.items}>
            {premiumItems.map((label) => (
              <View key={label} style={styles.row}>
                {isSubscribed ? (
                  <Check size={15} color={THEME.colors.calm.lavenderDeep} />
                ) : (
                  <View style={styles.lockIcon}>
                    <Lock size={13} color={THEME.colors.calm.lavenderDeep} />
                  </View>
                )}
                <Text style={[styles.premiumText, isSubscribed && styles.premiumTextActive]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.calm.card,
    borderColor: THEME.colors.calm.border,
  },
  title: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: THEME.spacing.sm,
  },
  column: {
    flex: 1,
    gap: THEME.spacing.xs,
  },
  columnDivider: {
    width: 1,
    backgroundColor: THEME.colors.calm.border,
    marginVertical: 2,
  },
  columnLabel: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    fontFamily: THEME.fonts.heading.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  premiumColumn: {
    backgroundColor: THEME.colors.tint.blue.veryFaint,
    borderRadius: THEME.borderRadius.standard,
    padding: THEME.spacing.xs,
    margin: -THEME.spacing.xs,
    marginLeft: 0,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumLabel: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    flex: 1,
  },
  items: {
    gap: THEME.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  freeText: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  lockIcon: {
    width: 15,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumText: {
    ...THEME.typography.small,
    color: THEME.colors.text.main,
    flex: 1,
    lineHeight: 20,
    fontFamily: THEME.fonts.heading.medium,
  },
  premiumTextActive: {
    color: THEME.colors.calm.lavenderDeep,
  },
});
