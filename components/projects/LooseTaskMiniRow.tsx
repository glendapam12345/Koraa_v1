import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { ChevronRight, GripVertical, Pencil, Trash2 } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { LooseTaskSummary } from '@/lib/looseTasks';

import type { TranslationKey } from '@/lib/i18n';

type LooseTaskMiniRowProps = {
  task: LooseTaskSummary;
  accentColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Mantén presionado en los dados para mover de área. */
  onMoveRequest?: () => void;
};

function relativeAgeLabel(
  iso: string,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return t('looseTasks.addedToday');
  if (days === 1) return t('looseTasks.addedYesterday');
  return t('looseTasks.addedDaysAgo', { days });
}

export function LooseTaskMiniRow({
  task,
  accentColor,
  backgroundColor,
  borderColor,
  onPress,
  onEdit,
  onDelete,
  onMoveRequest,
}: LooseTaskMiniRowProps) {
  const { t } = useI18n();
  const borderLeftColor = accentColor ?? THEME.colors.calm.lavenderDeep;
  const handlePress = onEdit ?? onPress;

  return (
    <View
      style={[
        styles.row,
        {
          borderLeftColor,
          backgroundColor: backgroundColor ?? THEME.colors.calm.mist,
          borderColor: borderColor ?? THEME.colors.calm.border,
        },
      ]}
    >
      {onMoveRequest ? (
        <Pressable
          style={styles.dragHandle}
          onLongPress={onMoveRequest}
          delayLongPress={220}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={t('areasCompact.moveTaskA11y', { task: task.content.slice(0, 40) })}
          accessibilityHint={t('areasCompact.looseRowDragHint')}
        >
          <GripVertical size={16} color={THEME.colors.text.tertiary} strokeWidth={2.5} />
        </Pressable>
      ) : null}

      <TouchableOpacity
        style={styles.mainTap}
        onPress={handlePress}
        disabled={!handlePress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={t('looseTasks.openTaskA11y', { task: task.content })}
        accessibilityHint={onEdit ? t('looseTasks.editTaskA11y', { task: task.content }) : undefined}
      >
        <View style={styles.textCol}>
          <Text style={styles.content}>{task.content}</Text>
          <Text style={styles.meta}>{relativeAgeLabel(task.created_at, t)}</Text>
        </View>
      </TouchableOpacity>

      {onEdit ? (
        <TouchableOpacity
          onPress={onEdit}
          style={styles.actionBtn}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t('looseTasks.editTaskA11y', { task: task.content })}
        >
          <Pencil size={16} color={THEME.colors.calm.lavenderDeep} />
        </TouchableOpacity>
      ) : null}

      {onDelete ? (
        <TouchableOpacity
          onPress={onDelete}
          style={styles.actionBtn}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t('looseTasks.deleteTaskA11y', { task: task.content })}
        >
          <Trash2 size={16} color={THEME.colors.semantic.danger} />
        </TouchableOpacity>
      ) : null}

      {onPress && !onEdit ? (
        <TouchableOpacity
          onPress={onPress}
          style={styles.actionBtn}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t('looseTasks.openTaskA11y', { task: task.content })}
        >
          <ChevronRight size={16} color={THEME.colors.text.tertiary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
    paddingVertical: 6,
    paddingLeft: 2,
    paddingRight: 4,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderLeftWidth: 3,
    minHeight: 44,
  },
  dragHandle: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    flexShrink: 0,
    paddingVertical: 4,
  },
  mainTap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: 2,
    paddingLeft: 2,
  },
  textCol: {
    gap: 2,
    flexShrink: 1,
    minWidth: 0,
  },
  content: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 18,
    flexShrink: 1,
  },
  meta: {
    ...THEME.typography.micro,
    color: THEME.colors.text.tertiary,
    lineHeight: 14,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
