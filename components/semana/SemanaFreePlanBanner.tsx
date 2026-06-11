import { View, Text, StyleSheet } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { useI18n } from '@/contexts/I18nContext';
import { FREE_CALENDAR_VISIBLE_DAYS } from '@/lib/semanaFreePlan';

type SemanaFreePlanBannerProps = {
  viewMode: 'calendar' | 'list';
};

/** Resume qué incluye Calendario en plan gratis — sin presión. */
export function SemanaFreePlanBanner({ viewMode }: SemanaFreePlanBannerProps) {
  const { t } = useI18n();

  const bodyKey =
    viewMode === 'calendar' ? 'semana.freePlanBannerCalendar' : 'semana.freePlanBannerList';

  return (
    <View accessibilityRole="summary">
      <CalmCard style={styles.card}>
        <View style={styles.header}>
          <CalendarDays size={18} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.title}>{t('semana.freePlanBannerTitle')}</Text>
        </View>
        <Text style={styles.body}>
          {t(bodyKey, { days: FREE_CALENDAR_VISIBLE_DAYS })}
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
    ...THEME.typography.caption,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    flex: 1,
  },
  body: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
});
