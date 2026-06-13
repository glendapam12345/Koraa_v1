import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import { THEME } from '@/constants/theme';
import type { FocusProgressStats } from '@/lib/focusProgressStats';
import { HoyFocusTaskRow } from '@/components/hoy/HoyFocusTaskRow';
import { HoyMoodHeroCard } from '@/components/hoy/HoyMoodHeroCard';
import { HoySleepCard } from '@/components/hoy/HoySleepCard';
import { HoyLightenLoadCard } from '@/components/hoy/HoyLightenLoadCard';
import { HoyLitePeekCard } from '@/components/hoy/HoyLitePeekCard';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useHoyCoachMessage } from '@/hooks/useHoyCoachMessage';
import { getEmotionEmoji } from '@/lib/emotionEmoji';
import { isOverwhelmedState } from '@/lib/emotionalSafety';
import { CARE_MODE_MAX_FOCUS_STEPS, getCareModeTaskCounts } from '@/lib/hoyCareMode';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';
import type { AppLocale } from '@/lib/i18n';

const DEFAULT_MAX_STEPS = 2;

type HoyFocusPanelProps = {
  userId?: string;
  locale: AppLocale;
  displayName: string;
  todayMood: string;
  emotionLabel: string;
  energyLevel: number;
  time?: string;
  focusLevel?: string;
  coachSuggestion: string;
  priorityStats: FocusProgressStats;
  focusTasks: Task[];
  totalPending: number;
  projectsMap: Record<string, { name: string; color?: string }>;
  onToggleTask: (taskId: string) => void;
  onOpenTask: (task: Task) => void;
  restExpanded?: boolean;
  onRestExpandedChange?: (open: boolean) => void;
  onDeleteTask?: (task: Task) => void;
  onChangeEmotion?: () => void;
  onLightenLoad?: () => void;
  /** Primer día en Hoy: menos secciones; el peek explica qué hay guardado. */
  compactLayout?: boolean;
  onShowFullView?: () => void;
  /** Salud: sueño corto anoche → mostrar menos pasos visibles. */
  shortSleep?: boolean;
  sleepCard?: {
    available: boolean;
    connected: boolean;
    lastNightHours: number | null;
    shortSleep: boolean;
    onConnect: () => void;
    onOpenSleep: () => void;
  };
  /** Emergency Kit: suaviza pasos sugeridos (1 visible, el resto puede esperar). */
  crisisMode?: boolean;
};

export function HoyFocusPanel({
  userId,
  locale,
  displayName,
  emotionLabel,
  energyLevel,
  time = '',
  focusLevel = '',
  todayMood,
  coachSuggestion,
  priorityStats,
  focusTasks,
  totalPending,
  projectsMap,
  onToggleTask,
  onOpenTask,
  restExpanded = false,
  onRestExpandedChange,
  onDeleteTask,
  onChangeEmotion,
  onLightenLoad,
  compactLayout = false,
  onShowFullView,
  shortSleep = false,
  sleepCard,
  crisisMode = false,
}: HoyFocusPanelProps) {
  const { t } = useI18n();
  const [extraFocusExpanded, setExtraFocusExpanded] = useState(false);

  const emotionEmoji = getEmotionEmoji(todayMood);
  const incompleteFocusTasks = useMemo(
    () => focusTasks.filter((task) => !task.is_completed),
    [focusTasks],
  );
  const nonFocusPending = Math.max(0, totalPending - incompleteFocusTasks.length);
  const allFocusDone =
    priorityStats.total > 0 && priorityStats.done >= priorityStats.total;

  const coachInput = {
    locale,
    displayName,
    emotionKey: todayMood,
    emotionLabel,
    energyLevel,
    suggestion: coachSuggestion,
    focusCount: incompleteFocusTasks.length,
  };

  const { coach } = useHoyCoachMessage(userId, coachInput);

  const openFeel = () => {
    if (onChangeEmotion) {
      onChangeEmotion();
      return;
    }
    openRecheckCheckIn('hoy_focus');
  };

  const focusTaskNames = useMemo(
    () => incompleteFocusTasks.map((task) => task.content.trim()).filter(Boolean),
    [incompleteFocusTasks],
  );
  const firstFocusTaskName = focusTaskNames[0];
  const totalFocusCount = incompleteFocusTasks.length;
  const isOverwhelmed = isOverwhelmedState(todayMood, energyLevel);
  const maxVisibleSteps = crisisMode
    ? CARE_MODE_MAX_FOCUS_STEPS
    : isOverwhelmed || shortSleep
      ? 1
      : DEFAULT_MAX_STEPS;
  const hiddenInSection =
    incompleteFocusTasks.length > maxVisibleSteps
      ? incompleteFocusTasks.length - maxVisibleSteps
      : 0;
  const visibleFocusTasks = useMemo(() => {
    if (extraFocusExpanded || hiddenInSection === 0) {
      return incompleteFocusTasks;
    }
    return incompleteFocusTasks.slice(0, maxVisibleSteps);
  }, [extraFocusExpanded, hiddenInSection, incompleteFocusTasks, maxVisibleSteps]);

  const showLightenLoad =
    !crisisMode &&
    !compactLayout &&
    Boolean(onLightenLoad) &&
    totalPending > 0;
  const coachLine = coach?.body ?? t('hoy.focusCoachFallback');
  const careCounts = crisisMode ? getCareModeTaskCounts(totalFocusCount, nonFocusPending) : null;
  const moodFocusCount = careCounts?.visibleFocus ?? totalFocusCount;
  const moodRestCount = careCounts?.waitingCount ?? nonFocusPending;
  const restLinkCount = careCounts?.waitingCount ?? nonFocusPending;
  const showRestOfDayLink =
    !compactLayout &&
    restLinkCount > 0 &&
    !restExpanded &&
    Boolean(onRestExpandedChange);

  return (
    <View style={styles.root}>
      <HoyMoodHeroCard
        emotionEmoji={emotionEmoji}
        emotionLabel={emotionLabel}
        energyLevel={energyLevel}
        focusCount={moodFocusCount}
        restCount={moodRestCount}
        firstFocusTaskName={firstFocusTaskName}
        coachLine={coachLine}
        allFocusDone={allFocusDone}
        compact={compactLayout}
        onPress={openFeel}
      />

      {!compactLayout && todayMood && energyLevel > 0 && sleepCard ? (
        <HoySleepCard
          energyLevel={energyLevel}
          emotionKey={todayMood}
          available={sleepCard.available}
          connected={sleepCard.connected}
          lastNightHours={sleepCard.lastNightHours}
          shortSleep={sleepCard.shortSleep}
          onConnect={sleepCard.onConnect}
          onOpenSleep={sleepCard.onOpenSleep}
        />
      ) : null}

      <View style={styles.focusHeader}>
        <Text style={styles.sectionTitle}>
          {focusTasks.length > 0
            ? t('hoy.enoughForToday')
            : t('hoy.focusTasksSection')}
        </Text>
        {focusTasks.length > 0 ? (
          <Text style={styles.sectionSub}>
            {crisisMode
              ? t('hoy.careModeFocusHint')
              : hiddenInSection > 0
                ? t('hoy.oneSmallStep')
                : t('hoy.focusListHint')}
          </Text>
        ) : null}
      </View>

      <CalmCard style={styles.focusCard}>
        {allFocusDone ? (
          <View style={styles.celebration}>
            <Sparkles size={28} color={THEME.colors.calm.lavenderDeep} />
            <Text style={styles.celebrationTitle}>{t('hoy.focusAllDoneTitle')}</Text>
            <Text style={styles.celebrationBody}>{t('hoy.focusAllDoneBody')}</Text>
          </View>
        ) : focusTasks.length > 0 ? (
          <View style={styles.focusBlock}>
            <View style={styles.taskList}>
              {visibleFocusTasks.map((task, index) => (
                <HoyFocusTaskRow
                  key={task.id}
                  task={task}
                  index={index}
                  projectName={
                    task.project_id ? projectsMap[task.project_id]?.name ?? null : null
                  }
                  onToggleComplete={() => onToggleTask(task.id)}
                  onOpenDetails={() => onOpenTask(task)}
                  onDelete={onDeleteTask ? () => onDeleteTask(task) : undefined}
                />
              ))}
            </View>
            {hiddenInSection > 0 && !extraFocusExpanded && !crisisMode ? (
              <TouchableOpacity
                onPress={() => setExtraFocusExpanded(true)}
                activeOpacity={0.85}
                style={styles.moreStepsBtn}
                accessibilityRole="button"
                accessibilityLabel={t('hoy.seeMoreSteps', { count: hiddenInSection })}
              >
                <Text style={styles.moreStepsText}>
                  {t('hoy.seeMoreSteps', { count: hiddenInSection })}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>{t('hoy.focusEmptyTitle')}</Text>
            <Text style={styles.emptyBody}>{t('hoy.focusEmptyBody')}</Text>
            <Text style={styles.emptyTabHint}>{t('hoy.focusEmptyTasksTab')}</Text>
            <CalmPrimaryButton
              label={t('hoy.focusGoTasksCta')}
              onPress={() => router.push('/(tabs)/vaciar')}
              variant="soft"
              accessibilityHint={t('hoy.focusGoTasksHint')}
            />
          </View>
        )}
      </CalmCard>

      {showLightenLoad ? (
        <HoyLightenLoadCard
          onPress={onLightenLoad!}
          emphasized={isOverwhelmed || nonFocusPending > 0}
        />
      ) : null}

      {compactLayout && onShowFullView && onRestExpandedChange ? (
        <HoyLitePeekCard
          restCount={nonFocusPending}
          onShowMoreForToday={() => onRestExpandedChange(true)}
          onShowFullView={onShowFullView}
        />
      ) : null}

      {showRestOfDayLink ? (
        <TouchableOpacity
          onPress={() => onRestExpandedChange?.(true)}
          activeOpacity={0.85}
          style={styles.restOfDayLink}
          accessibilityRole="button"
          accessibilityLabel={
            crisisMode
              ? t('hoy.careModeRestLinkA11y', { count: restLinkCount })
              : t('hoy.showMoreForTodayLink')
          }
        >
          <Text style={styles.restOfDayLinkText}>
            {crisisMode
              ? restLinkCount === 1
                ? t('hoy.careModeRestLinkOne', { count: restLinkCount })
                : t('hoy.careModeRestLinkMany', { count: restLinkCount })
              : t('hoy.showMoreForTodayLink')}
          </Text>
          <ChevronRight size={18} color={THEME.colors.calm.lavenderDeep} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: THEME.layout.tabSectionGap,
  },
  focusHeader: {
    gap: 4,
    marginTop: THEME.spacing.xs,
  },
  sectionTitle: {
    ...THEME.typography.sectionTitle,
    color: THEME.colors.text.main,
  },
  sectionSub: {
    ...THEME.typography.small,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  focusCard: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
  },
  focusBlock: {
    gap: THEME.spacing.sm,
  },
  taskList: {
    gap: THEME.spacing.md,
  },
  moreStepsBtn: {
    alignSelf: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  moreStepsText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
    textDecorationLine: 'underline',
  },
  emptyBlock: {
    gap: THEME.spacing.xs,
  },
  emptyTabHint: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    marginTop: THEME.spacing.xs,
  },
  celebration: {
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
  },
  celebrationTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text.main,
    fontFamily: THEME.fonts.heading.bold,
    textAlign: 'center',
  },
  celebrationBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyTitle: {
    ...THEME.typography.h3,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.text.main,
  },
  emptyBody: {
    ...THEME.typography.body,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  restOfDayLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: THEME.spacing.sm,
  },
  restOfDayLinkText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
});
