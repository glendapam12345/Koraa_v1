import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import type { LooseTaskSummary } from '@/lib/looseTasks';

import type { TranslationKey } from '@/lib/i18n';

type LooseTaskMiniRowProps = {
  task: LooseTaskSummary;
  accentColor?: string;
  onPress: () => void;
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

export function LooseTaskMiniRow({ task, accentColor, onPress }: LooseTaskMiniRowProps) {
  const { t } = useI18n();
  const borderColor = accentColor ?? THEME.colors.calm.lavenderDeep;

  return (
    <TouchableOpacity
      style={[styles.row, { borderLeftColor: borderColor }]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={t('looseTasks.openTaskA11y', { task: task.content })}
    >
      <View style={styles.textCol}>
        <Text style={styles.content} numberOfLines={2}>
          {task.content}
        </Text>
        <Text style={styles.meta}>{relativeAgeLabel(task.created_at, t)}</Text>
      </View>
      <ChevronRight size={16} color={THEME.colors.text.tertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.standard,
    backgroundColor: THEME.colors.calm.mist,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    borderLeftWidth: 3,
    minHeight: 44,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  content: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 18,
  },
  meta: {
    ...THEME.typography.micro,
    color: THEME.colors.text.tertiary,
    lineHeight: 14,
  },
});
