import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { DayTimelineView } from '@/components/tasks/experience/DayTimelineView';
import { useI18n } from '@/contexts/I18nContext';
import type { DayTimelineModel } from '@/lib/lifeAreas/types';

type VnextDailyTimelineCardProps = {
  model: DayTimelineModel;
  focusLabel?: string;
  availableHoursLabel?: string;
};

export function VnextDailyTimelineCard({
  model,
  focusLabel,
  availableHoursLabel,
}: VnextDailyTimelineCardProps) {
  const { t } = useI18n();

  return (
    <CalmCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('vnext.timelineTitle')}</Text>
        {focusLabel || availableHoursLabel ? (
          <View style={styles.metaRow}>
            {focusLabel ? (
              <Text style={styles.meta}>{t('vnext.timelineFocus', { focus: focusLabel })}</Text>
            ) : null}
            {availableHoursLabel ? (
              <Text style={styles.meta}>
                {t('vnext.timelineTime', { time: availableHoursLabel })}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      <DayTimelineView model={model} />
    </CalmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: THEME.spacing.sm,
  },
  header: {
    gap: 4,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
  },
  metaRow: {
    gap: 2,
  },
  meta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
  },
});
