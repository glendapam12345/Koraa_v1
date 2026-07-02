import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { HoyDayAgendaItem } from '@/lib/hoy/buildHoyDayAgenda';

type HoyDayAgendaProps = {
  items: HoyDayAgendaItem[];
  onOpenTask: (taskId: string) => void;
};

export function HoyDayAgenda({ items, onOpenTask }: HoyDayAgendaProps) {
  const { t } = useI18n();

  if (items.length === 0) return null;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={t('hoy.dayAgendaSectionA11y', { count: items.length })}
    >
      <Text style={styles.title}>{t('hoy.dayAgendaTitle')}</Text>
      <View style={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <View key={item.taskId} style={styles.row}>
              <View style={styles.timeCol}>
                <Text style={styles.timeLabel}>{item.timeLabel}</Text>
                {!isLast ? <View style={styles.connector} /> : null}
              </View>
              <TouchableOpacity
                style={[styles.card, { borderLeftColor: item.accentColor }]}
                onPress={() => onOpenTask(item.taskId)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={t('hoy.dayAgendaRowA11y', {
                  time: item.timeLabel,
                  task: item.title,
                  duration: item.durationLabel ?? t('hoy.dayAgendaNoDuration'),
                })}
              >
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.durationLabel ? (
                  <Text style={styles.cardMeta}>{item.durationLabel}</Text>
                ) : null}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.xs,
  },
  title: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    paddingHorizontal: 2,
  },
  list: {
    gap: THEME.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: THEME.spacing.sm,
  },
  timeCol: {
    width: 56,
    alignItems: 'flex-end',
    paddingTop: 10,
  },
  timeLabel: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 16,
    textAlign: 'right',
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 12,
    marginTop: 6,
    marginRight: 4,
    borderRadius: 1,
    backgroundColor: THEME.colors.calm.border,
  },
  card: {
    flex: 1,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderLeftWidth: 3,
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.sm,
    gap: 2,
    minHeight: 52,
    justifyContent: 'center',
  },
  cardTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  cardMeta: {
    ...THEME.typography.micro,
    color: THEME.colors.text.secondary,
    lineHeight: 14,
  },
});
