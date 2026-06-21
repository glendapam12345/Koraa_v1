import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import type { FrenteWeekInsightBar } from '@/lib/vnext/buildFrentesDashboard';

type FrentesWeekInsightCardProps = {
  bars: FrenteWeekInsightBar[];
};

export function FrentesWeekInsightCard({ bars }: FrentesWeekInsightCardProps) {
  const { t } = useI18n();

  if (bars.length === 0) return null;

  return (
    <CalmCard style={styles.card}>
      <View style={styles.header}>
        <Sparkles size={14} color={THEME.colors.calm.lavenderDeep} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('vnext.frentesInsightTitle')}</Text>
        </View>
      </View>

      <View style={styles.bars}>
        {bars.map((bar) => (
          <View key={bar.key} style={styles.row}>
            <View style={styles.rowLabel}>
              <Text style={styles.emoji}>{bar.emoji}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {bar.name}
              </Text>
              <Text style={styles.percent}>{bar.percent}%</Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.max(bar.percent, 4)}%`,
                    backgroundColor: bar.color,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 18,
  },
  bars: {
    gap: 8,
  },
  row: {
    gap: 4,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emoji: {
    fontSize: THEME.typography.body.fontSize,
    lineHeight: 18,
  },
  name: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    flex: 1,
  },
  percent: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    minWidth: 30,
    textAlign: 'right',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.calm.mist,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
