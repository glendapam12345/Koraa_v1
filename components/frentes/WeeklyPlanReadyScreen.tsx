import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Heart, Sparkles, Undo2 } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { PlanRealismCard } from '@/components/vnext/PlanRealismCard';
import type { CaptureFront } from '@/lib/captureProjectFronts';
import type { PlanRealismResult } from '@/lib/vnext/types';
import { frontThemeForFront } from '@/lib/frentes/frontTheme';
import type { WeekPlannerDay, WeekPlannerTask } from '@/lib/lifeAreas/types';

function findFrontForTask(task: WeekPlannerTask, fronts: CaptureFront[]): CaptureFront | undefined {
  return (
    fronts.find((front) => front.tasks.some((entry) => entry.content === task.title)) ??
    fronts.find((front) => front.projectId === task.areaId) ??
    fronts.find((front) => front.key === task.areaId)
  );
}

type WeeklyPlanReadyScreenProps = {
  days: WeekPlannerDay[];
  fronts: CaptureFront[];
  movedCount?: number;
  freedHours?: string;
  focusFrontName?: string;
  realism?: PlanRealismResult;
  onContinue: () => void;
  onViewChanges?: () => void;
};

function dayLabel(day: WeekPlannerDay, index: number, t: (key: string) => string): string {
  if (day.isToday) return t('frentes.weekToday');
  if (index === 1) return t('frentes.weekTomorrow');
  return day.shortLabel.split(' ')[0] ?? day.shortLabel;
}

export function WeeklyPlanReadyScreen({
  days,
  fronts,
  movedCount = 0,
  freedHours,
  focusFrontName,
  realism,
  onContinue,
  onViewChanges,
}: WeeklyPlanReadyScreenProps) {
  const { t } = useI18n();

  const visibleDays = days.slice(0, 5);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('frentes.weekReadyTitle')}</Text>
          <Text style={styles.sub}>
            {focusFrontName
              ? t('vnext.weekFocusSub', { focus: focusFrontName })
              : movedCount > 0
                ? t('frentes.weekReadySub', { count: movedCount })
                : t('frentes.weekReadySubCalm')}
          </Text>
        </View>
        {onViewChanges ? (
          <TouchableOpacity style={styles.changesBtn} onPress={onViewChanges} accessibilityRole="button">
            <Undo2 size={16} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.changesText}>{t('frentes.weekViewChanges')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {realism ? <PlanRealismCard realism={realism} /> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
        {visibleDays.map((day, dayIndex) => (
          <View key={day.id} style={styles.column}>
            <Text style={styles.columnTitle}>{dayLabel(day, dayIndex, t)}</Text>
            <View style={styles.columnTasks}>
              {day.tasks.length === 0 ? (
                <View style={styles.restCard}>
                  <Text style={styles.restEmoji}>🌿</Text>
                  <Text style={styles.restText}>{t('frentes.weekFreeDay')}</Text>
                </View>
              ) : (
                day.tasks.map((task) => {
                  const front = findFrontForTask(task, fronts);
                  const theme = front
                    ? frontThemeForFront(front)
                    : frontThemeForFront({ key: task.areaId, name: task.areaId });
                  return (
                    <View
                      key={task.id}
                      style={[styles.taskCard, { backgroundColor: theme.bg, borderColor: theme.border }]}
                    >
                      <Text style={styles.taskEmoji}>{task.iconEmoji}</Text>
                      <Text style={[styles.taskTitle, { color: theme.accent }]} numberOfLines={2}>
                        {task.title}
                      </Text>
                      <Text style={styles.taskTime}>{task.timeLabel}</Text>
                    </View>
                  );
                })
              )}
            </View>
            <Text style={styles.addHint}>{t('frentes.weekAddTask')}</Text>
          </View>
        ))}
      </ScrollView>

      <LinearGradient
        colors={[THEME.colors.calm.lavender, THEME.colors.calm.background]}
        style={styles.footer}
      >
        <View style={styles.footerItem}>
          <Clock size={16} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.footerText}>
            {freedHours
              ? t('frentes.weekFreedHours', { hours: freedHours })
              : t('frentes.weekAdaptable')}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Heart size={16} color={THEME.colors.gradient.pink} />
          <Text style={styles.footerText}>{t('frentes.weekKeepPriorities')}</Text>
        </View>
        <View style={styles.footerItem}>
          <Sparkles size={16} color={THEME.colors.calm.lavenderDeep} />
          <Text style={styles.footerText}>{t('frentes.weekAdaptablePlan')}</Text>
        </View>
      </LinearGradient>

      <CalmPrimaryButton label={t('frentes.weekContinue')} onPress={onContinue} large />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...THEME.typography.h2,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 32,
  },
  sub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  changesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    backgroundColor: THEME.colors.calm.card,
  },
  changesText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  board: {
    gap: 12,
    paddingVertical: 4,
  },
  column: {
    width: 148,
    gap: 8,
    padding: 10,
    borderRadius: 20,
    backgroundColor: THEME.colors.calm.card,
    borderWidth: 1,
    borderColor: THEME.colors.calm.border,
    ...THEME.shadows.soft,
  },
  columnTitle: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    textAlign: 'center',
  },
  columnTasks: {
    gap: 8,
    minHeight: 120,
  },
  taskCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  taskEmoji: {
    fontSize: THEME.typography.body.fontSize,
    lineHeight: 20,
  },
  taskTitle: {
    ...THEME.typography.small,
    fontFamily: THEME.fonts.heading.bold,
  },
  taskTime: {
    ...THEME.typography.micro,
    color: THEME.colors.text.tertiary,
  },
  restCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 4,
    borderRadius: 14,
    backgroundColor: THEME.colors.calm.mist,
  },
  restEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  restText: {
    ...THEME.typography.meta,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  addHint: {
    ...THEME.typography.micro,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
  },
  footer: {
    borderRadius: 20,
    padding: THEME.spacing.md,
    gap: 10,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    flex: 1,
    lineHeight: 18,
    fontFamily: THEME.fonts.heading.medium,
  },
});
