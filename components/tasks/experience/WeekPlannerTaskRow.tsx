import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Circle, Star, GripVertical } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import type { WeekPlannerTask, LifeArea } from '@/lib/lifeAreas/types';

type WeekPlannerTaskRowProps = {
  task: WeekPlannerTask;
  areas: LifeArea[];
  onLongPress?: () => void;
};

function findArea(areas: LifeArea[], id: string): LifeArea | undefined {
  return areas.find((area) => area.id === id);
}

export function WeekPlannerTaskRow({ task, areas, onLongPress }: WeekPlannerTaskRowProps) {
  const area = findArea(areas, task.areaId);

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      delayLongPress={280}
      activeOpacity={0.92}
      accessibilityRole="button"
      style={[styles.row, area ? { borderLeftColor: area.color } : null]}
    >
      <GripVertical size={16} color={THEME.colors.text.tertiary} />
      <Text style={styles.icon}>{task.iconEmoji}</Text>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={styles.meta}>
          {task.timeLabel} · {task.durationLabel}
        </Text>
      </View>
      <View style={styles.status}>
        {task.status === 'done' ? (
          <Check size={18} color={THEME.colors.semantic.success} strokeWidth={2.5} />
        ) : task.status === 'star' ? (
          <Star size={18} color={THEME.colors.accent.star} fill={THEME.colors.accent.star} />
        ) : (
          <Circle size={18} color={THEME.colors.text.tertiary} strokeWidth={2} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: THEME.colors.calm.card,
    borderRadius: 18,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.calm.lavenderDeep,
    ...THEME.shadows.soft,
  },
  icon: {
    fontSize: THEME.typography.displayEmojiSm.fontSize,
    lineHeight: 24,
    width: 28,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...THEME.typography.screenSubtitle,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.main,
    lineHeight: 20,
  },
  meta: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 16,
  },
  status: {
    width: 28,
    alignItems: 'center',
  },
});
