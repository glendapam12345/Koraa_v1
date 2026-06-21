import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart } from 'lucide-react-native';
import { THEME } from '@/constants/theme';
import { useI18n } from '@/contexts/I18nContext';
import { WeekDateStrip } from '@/components/tasks/experience/WeekDateStrip';
import { WeekDaySection } from '@/components/tasks/experience/WeekDaySection';
import { WeekPlannerDragBoard } from '@/components/tasks/experience/WeekPlannerDragBoard';
import { DayTimelineView } from '@/components/tasks/experience/DayTimelineView';
import { MonthPlannerView } from '@/components/tasks/experience/MonthPlannerView';
import { MoveTaskToDaySheet } from '@/components/tasks/experience/MoveTaskToDaySheet';
import type { LifeArea, WeekPlannerDay, WhatChangedReason } from '@/lib/lifeAreas/types';
import type { MonthPlannerModel } from '@/lib/lifeAreas/monthPlanner';
import { buildDayTimeline } from '@/lib/lifeAreas/experienceDataMappers';
import { buildLifeAreaIndex } from '@/lib/lifeAreas/projectToLifeArea';
import { VISION_PASTELS } from '@/lib/lifeAreas/visionPalette';

type WeekPlannerViewProps = {
  days: WeekPlannerDay[];
  areas: LifeArea[];
  monthModel?: MonthPlannerModel;
  onBack?: () => void;
  onMoveTask?: (taskId: string, targetDayId: string) => Promise<{ ok: boolean }>;
  lastReason?: WhatChangedReason | null;
};

type PlannerMode = 'day' | 'week' | 'month';

export function WeekPlannerView({
  days,
  areas,
  monthModel,
  onBack,
  onMoveTask,
  lastReason,
}: WeekPlannerViewProps) {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<PlannerMode>('week');
  const [selectedDayId, setSelectedDayId] = useState(days.find((d) => d.isToday)?.id ?? days[0]?.id);
  const [moveTask, setMoveTask] = useState<{ taskId: string; dayId: string; title: string } | null>(
    null,
  );
  const [moving, setMoving] = useState(false);

  const selectedDay =
    days.find((day) => day.id === selectedDayId) ??
    days.find((day) => day.isToday) ??
    days[0];

  const looseLabel = t('projectsUi.looseTitle');
  const areaIndex = useMemo(() => {
    const projects = areas
      .filter((area) => area.id !== 'loose')
      .map((area) => ({ id: area.id, name: area.name, color: area.color }));
    return buildLifeAreaIndex(projects, looseLabel);
  }, [areas, looseLabel]);

  const timelineModel = selectedDay
    ? buildDayTimeline(selectedDay, areaIndex, locale, {
        showNewEventAnnotation: lastReason === 'new_event',
      })
    : null;

  const handleRequestMove = (taskId: string, dayId: string) => {
    const task = days.flatMap((day) => day.tasks).find((entry) => entry.id === taskId);
    if (!task) return;
    setMoveTask({ taskId, dayId, title: task.title });
  };

  const handleMoveToDay = async (targetDayId: string) => {
    if (!moveTask || !onMoveTask) return;
    setMoving(true);
    try {
      await onMoveTask(moveTask.taskId, targetDayId);
      setSelectedDayId(targetDayId);
    } finally {
      setMoving(false);
      setMoveTask(null);
    }
  };

  const handleMonthSelect = (date: string) => {
    setSelectedDayId(date);
    setMode('day');
  };

  const hintKey =
    mode === 'week' && onMoveTask
      ? 'tasksExperience.vision.plannerDragHintActive'
      : 'tasksExperience.vision.plannerMoveHint';

  return (
    <LinearGradient
      colors={[VISION_PASTELS.sky, THEME.colors.calm.background]}
      style={styles.shell}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t('tasksExperience.vision.weekTitle')}</Text>
            <Heart size={18} color={THEME.colors.gradient.pink} fill={THEME.colors.gradient.pink} />
          </View>
          <Text style={styles.sub}>{t('tasksExperience.vision.weekSub')}</Text>
        </View>
        {onBack ? (
          <TouchableOpacity onPress={onBack} accessibilityRole="button">
            <Text style={styles.backLink}>{t('tasksExperience.vision.backToMind')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.segment}>
        {(['day', 'week', 'month'] as const).map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.segmentPill, mode === item && styles.segmentPillActive]}
            onPress={() => setMode(item)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === item }}
          >
            <Text style={[styles.segmentText, mode === item && styles.segmentTextActive]}>
              {t(`tasksExperience.vision.plannerMode.${item}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode !== 'month' ? (
        <WeekDateStrip
          days={days}
          selectedId={selectedDayId ?? ''}
          onSelect={(dayId) => {
            setSelectedDayId(dayId);
          }}
        />
      ) : null}

      {mode === 'month' && monthModel ? (
        <MonthPlannerView
          model={monthModel}
          selectedDate={selectedDayId}
          onSelectDate={handleMonthSelect}
        />
      ) : null}

      {mode === 'day' && timelineModel ? (
        <DayTimelineView model={timelineModel} />
      ) : null}

      {mode === 'week' ? (
        <WeekPlannerDragBoard
          days={days}
          areas={areas}
          onMoveTask={onMoveTask}
          onRequestMoveSheet={onMoveTask ? handleRequestMove : undefined}
        />
      ) : null}

      {mode === 'day' && selectedDay ? (
        <View style={styles.days}>
          <WeekDaySection
            day={selectedDay}
            areas={areas}
            onRequestMove={onMoveTask ? handleRequestMove : undefined}
          />
        </View>
      ) : null}

      {moving ? (
        <ActivityIndicator color={THEME.colors.calm.lavenderDeep} style={styles.moving} />
      ) : null}

      <Text style={styles.hint}>{t(hintKey)}</Text>

      <MoveTaskToDaySheet
        visible={moveTask != null}
        taskTitle={moveTask?.title ?? ''}
        days={days}
        currentDayId={moveTask?.dayId ?? ''}
        onSelect={(dayId) => void handleMoveToDay(dayId)}
        onClose={() => setMoveTask(null)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 28,
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceOverlay.glassBorder,
    ...THEME.shadows.soft,
  },
  header: {
    gap: 6,
  },
  headerText: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
    lineHeight: 28,
  },
  sub: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
  },
  backLink: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.calm.mist,
    borderRadius: THEME.borderRadius.pill,
    padding: 4,
    gap: 4,
  },
  segmentPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.pill,
    alignItems: 'center',
  },
  segmentPillActive: {
    backgroundColor: THEME.colors.calm.card,
    ...THEME.shadows.soft,
  },
  segmentText: {
    ...THEME.typography.caption,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.text.secondary,
  },
  segmentTextActive: {
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
  },
  days: {
    gap: THEME.spacing.md,
  },
  moving: {
    alignSelf: 'center',
  },
  hint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
