import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { useI18n } from '@/contexts/I18nContext';
import { openPaywall } from '@/lib/paywallNavigation';

type SemanaFreeLimitCardProps = {
  hiddenDayCount: number;
};

/** Fin de la vista gratis en lista por día — días ocultos + CTA Premium opcional. */
export function SemanaFreeLimitCard({ hiddenDayCount }: SemanaFreeLimitCardProps) {
  const { t } = useI18n();

  if (hiddenDayCount <= 0) return null;

  return (
    <CalmCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Lock size={16} color={THEME.colors.calm.lavenderDeep} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>
            {t('semana.freeLimitTitle', { count: hiddenDayCount })}
          </Text>
          <Text style={styles.body}>{t('semana.freeLimitBody')}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => openPaywall(router, '/(tabs)/semana')}
        activeOpacity={0.85}
        style={styles.cta}
        accessibilityRole="button"
        accessibilityLabel={t('semana.freeLimitCta')}
        accessibilityHint={t('semana.freeLimitCtaHint')}
      >
        <Text style={styles.ctaText}>{t('semana.freeLimitCta')}</Text>
        <ChevronRight size={16} color={THEME.colors.calm.lavenderDeep} />
      </TouchableOpacity>
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.mist,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.calm.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  body: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: THEME.spacing.xs,
  },
  ctaText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
});
