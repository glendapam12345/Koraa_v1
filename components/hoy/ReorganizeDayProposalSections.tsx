import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { ReorganizeKeepItem, ReorganizeMoveItem } from '@/lib/lifeAreas/types';
import type { TaskPlanningMeta } from '@/lib/taskPlanningMeta';
import { formatDurationLabel } from '@/lib/taskPlanningMeta';
import { formatPreferredTimeLabel } from '@/lib/taskPreferredTime';

type ReorganizeDayProposalSectionsProps = {
  kept: ReorganizeKeepItem[];
  moved: ReorganizeMoveItem[];
  planningMeta?: Record<string, TaskPlanningMeta>;
  editable?: boolean;
  selectedTaskId?: string | null;
  onPressItem?: (taskId: string) => void;
};

function StepPlanningMetaLine({
  taskId,
  planningMeta,
}: {
  taskId: string;
  planningMeta: Record<string, TaskPlanningMeta>;
}) {
  const { locale } = useI18n();
  const meta = planningMeta[taskId];
  const durationLabel =
    meta?.estimatedMinutes && meta.estimatedMinutes > 0
      ? formatDurationLabel(meta.estimatedMinutes)
      : '';
  const timeLabel = formatPreferredTimeLabel(meta?.preferredTime, locale) ?? '';

  if (!durationLabel && !timeLabel) return null;

  return (
    <Text style={styles.stepMeta}>
      {[durationLabel, timeLabel].filter(Boolean).join(' · ')}
    </Text>
  );
}

function MoveRow({
  item,
  planningMeta,
  editable = false,
  selected = false,
  onPress,
}: {
  item: ReorganizeMoveItem;
  planningMeta: Record<string, TaskPlanningMeta>;
  editable?: boolean;
  selected?: boolean;
  onPress?: () => void;
}) {
  const body = (
    <>
      <Text style={styles.emoji}>{item.areaEmoji}</Text>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.moveMeta}>
          {item.fromLabel ? (
            <>
              <Text style={styles.moveFrom}>{item.fromLabel}</Text>
              <ArrowRight size={12} color={THEME.colors.calm.lavenderDeep} />
            </>
          ) : null}
          <Text style={styles.moveTo}>{item.toLabel}</Text>
        </View>
        <StepPlanningMetaLine taskId={item.taskId} planningMeta={planningMeta} />
      </View>
    </>
  );

  if (!editable) {
    return <View style={styles.row}>{body}</View>;
  }

  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {body}
    </TouchableOpacity>
  );
}

function KeepRow({
  item,
  planningMeta,
  editable = false,
  selected = false,
  onPress,
}: {
  item: ReorganizeKeepItem;
  planningMeta: Record<string, TaskPlanningMeta>;
  editable?: boolean;
  selected?: boolean;
  onPress?: () => void;
}) {
  const body = (
    <>
      <Text style={styles.emoji}>{item.areaEmoji}</Text>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.dateLabel ? <Text style={styles.keepDate}>{item.dateLabel}</Text> : null}
        <StepPlanningMetaLine taskId={item.taskId} planningMeta={planningMeta} />
      </View>
    </>
  );

  if (!editable) {
    return <View style={styles.row}>{body}</View>;
  }

  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {body}
    </TouchableOpacity>
  );
}

export function ReorganizeDayProposalSections({
  kept,
  moved,
  planningMeta = {},
  editable = false,
  selectedTaskId = null,
  onPressItem,
}: ReorganizeDayProposalSectionsProps) {
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      {kept.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('reorganizeDay.sectionKeep')}</Text>
          {kept.map((item) => (
            <KeepRow
              key={item.taskId}
              item={item}
              planningMeta={planningMeta}
              editable={editable}
              selected={selectedTaskId === item.taskId}
              onPress={() => onPressItem?.(item.taskId)}
            />
          ))}
        </View>
      ) : null}

      {moved.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('reorganizeDay.sectionMove')}</Text>
          {moved.map((item) => (
            <MoveRow
              key={item.taskId}
              item={item}
              planningMeta={planningMeta}
              editable={editable}
              selected={selectedTaskId === item.taskId}
              onPress={() => onPressItem?.(item.taskId)}
            />
          ))}
        </View>
      ) : null}

      {kept.length === 0 && moved.length === 0 ? (
        <Text style={styles.empty}>{t('reorganizeDay.emptyProposal')}</Text>
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
  sectionTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.colors.calm.border,
  },
  rowSelected: {
    backgroundColor: THEME.colors.calm.lavender,
    marginHorizontal: -THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.standard,
    borderBottomWidth: 0,
  },
  emoji: {
    fontSize: 16,
    lineHeight: 22,
    width: 22,
    textAlign: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 22,
  },
  keepDate: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  moveMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  moveFrom: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  moveTo: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.calm.lavenderDeep,
  },
  stepMeta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    lineHeight: 16,
  },
  empty: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
