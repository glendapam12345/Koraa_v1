import { View, Text, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { ReorganizeKeepItem, ReorganizeMoveItem } from '@/lib/lifeAreas/types';

type ReorganizeProposalListProps = {
  moved: ReorganizeMoveItem[];
  kept: ReorganizeKeepItem[];
};

function DeadlineBadge({ label }: { label: string }) {
  return (
    <View style={styles.deadlineBadge}>
      <Text style={styles.deadlineText}>{label}</Text>
    </View>
  );
}

function MoveRow({ item }: { item: ReorganizeMoveItem }) {
  return (
    <View style={styles.row}>
      <View style={[styles.accent, { backgroundColor: item.areaColor }]} />
      <Text style={styles.emoji}>{item.areaEmoji}</Text>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.moveMeta}>
          {item.fromLabel ? (
            <>
              <Text style={styles.moveFrom}>{item.fromLabel}</Text>
              <ArrowRight size={14} color={THEME.colors.calm.lavenderDeep} />
            </>
          ) : null}
          <Text style={styles.moveTo}>{item.toLabel}</Text>
        </View>
        {item.deadlineLabel ? <DeadlineBadge label={item.deadlineLabel} /> : null}
      </View>
    </View>
  );
}

function KeepRow({ item }: { item: ReorganizeKeepItem }) {
  return (
    <View style={styles.row}>
      <View style={[styles.accent, { backgroundColor: item.areaColor }]} />
      <Text style={styles.emoji}>{item.areaEmoji}</Text>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.dateLabel ? <Text style={styles.keepDate}>{item.dateLabel}</Text> : null}
        {item.deadlineLabel ? <DeadlineBadge label={item.deadlineLabel} /> : null}
      </View>
    </View>
  );
}

export function ReorganizeProposalList({ moved, kept }: ReorganizeProposalListProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      {moved.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('tasksExperience.reorganizeMoved')}</Text>
          {moved.map((item) => (
            <MoveRow key={item.taskId} item={item} />
          ))}
        </View>
      ) : null}

      {kept.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('tasksExperience.reorganizeKept')}</Text>
          {kept.map((item) => (
            <KeepRow key={item.taskId} item={item} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.md,
  },
  section: {
    gap: THEME.spacing.xs,
  },
  sectionLabel: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    minHeight: 36,
  },
  emoji: {
    fontSize: 18,
    lineHeight: 22,
    width: 24,
    textAlign: 'center',
    marginTop: 2,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  keepDate: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 16,
  },
  moveMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  moveFrom: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    textDecorationLine: 'line-through',
    lineHeight: 16,
  },
  moveTo: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
    lineHeight: 16,
  },
  deadlineBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.tint.pink.soft,
    borderWidth: 1,
    borderColor: THEME.colors.tint.pink.border,
  },
  deadlineText: {
    ...THEME.typography.meta,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.gradient.pink,
    lineHeight: 14,
  },
});
