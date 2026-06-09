import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import { THEME } from '@/constants/theme';
import type { FocusProgressStats } from '@/lib/focusProgressStats';
import { HoyFocusTaskRow } from '@/components/hoy/HoyFocusTaskRow';
import { HoyMoodHeroCard } from '@/components/hoy/HoyMoodHeroCard';
import { HoyDayFlowSection } from '@/components/hoy/HoyDayFlowSection';
import { KoraaLogicExplanation } from '@/components/hoy/KoraaLogicExplanation';
import { HoySupportPanel } from '@/components/hoy/HoySupportPanel';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useHoyCoachMessage } from '@/hooks/useHoyCoachMessage';
import { getEmotionEmoji } from '@/lib/emotionEmoji';
import { isOverwhelmedState } from '@/lib/emotionalSafety';
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
  showDayChangedCard?: boolean;
  showNothingDoneCard?: boolean;
  onQuickRecheck?: () => void;
  onDismissDayChanged?: () => void;
  onLightenLoad?: () => void;
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
  showDayChangedCard = false,
  showNothingDoneCard = false,
  onQuickRecheck,
  onDismissDayChanged,
  onLightenLoad,
}: HoyFocusPanelProps) {
  const { t } = useI18n();

  const setRestExpanded = (open: boolean) => {
    onRestExpandedChange?.(open);
  };

  const emotionEmoji = getEmotionEmoji(todayMood);
  const nonFocusPending = Math.max(0, totalPending - focusTasks.length);
  const allFocusDone =
    priorityStats.total > 0 && priorityStats.done >= priorityStats.total;

  const coachInput = {
    locale,
    displayName,
    emotionKey: todayMood,
    emotionLabel,
    energyLevel,
    suggestion: coachSuggestion,
    focusCount: focusTasks.length,
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
    () => focusTasks.filter((task) => !task.is_completed).map((task) => task.content.trim()).filter(Boolean),
    [focusTasks],
  );
  const firstFocusTaskName = focusTaskNames[0];
  const totalFocusCount = focusTasks.length;
  const isOverwhelmed = isOverwhelmedState(todayMood, energyLevel);
  const incompleteFocusTasks = focusTasks.filter((task) => !task.is_completed);
  const maxVisibleSteps = isOverwhelmed ? 1 : DEFAULT_MAX_STEPS;
  const hiddenInSection =
    incompleteFocusTasks.length > maxVisibleSteps
      ? incompleteFocusTasks.length - maxVisibleSteps
      : 0;
  const visibleFocusTasks = [
    ...incompleteFocusTasks.slice(0, maxVisibleSteps),
    ...focusTasks.filter((task) => task.is_completed),
  ];

  const showDayFlowCard =
    (showDayChangedCard || showNothingDoneCard) &&
    Boolean(onQuickRecheck && onDismissDayChanged && onLightenLoad);

  const showLightenInRest = Boolean(onLightenLoad) && (nonFocusPending > 0 || isOverwhelmed);
  const coachLine = coach?.body ?? t('hoy.focusCoachFallback');

  const hasRestContent =
    hiddenInSection > 0 ||
    showDayFlowCard ||
    showLightenInRest ||
    nonFocusPending > 0 ||
    (focusTasks.length > 0 && Boolean(time && focusLevel));

  return (
    <View style={styles.root}>
      <HoyMoodHeroCard
        emotionEmoji={emotionEmoji}
        emotionLabel={emotionLabel}
        energyLevel={energyLevel}
        focusCount={totalFocusCount}
        restCount={nonFocusPending}
        firstFocusTaskName={firstFocusTaskName}
        coachLine={coachLine}
        allFocusDone={allFocusDone}
      />

      <CalmPrimaryButton
        label={t('hoy.heroUpdateCheckIn')}
        onPress={openFeel}
        variant="soft"
        accessibilityLabel={t('hoy.heroUpdateCheckIn')}
        accessibilityHint={t('hoy.focusReorganizeA11y')}
      />

      <TouchableOpacity
        onPress={() => router.push('/(tabs)/vaciar')}
        activeOpacity={0.75}
        accessibilityRole="link"
        accessibilityLabel={t('hoy.captureTasksLink')}
        style={styles.captureLink}
      >
        <Text style={styles.captureLinkText}>{t('hoy.captureTasksLink')}</Text>
      </TouchableOpacity>

      <View style={styles.focusHeader}>
        <Text style={styles.sectionTitle}>
          {focusTasks.length > 0 ? t('hoy.enoughForToday') : t('hoy.focusTasksSection')}
        </Text>
        {focusTasks.length > 0 ? (
          <Text style={styles.sectionSub}>
            {hiddenInSection > 0
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
            {hiddenInSection > 0 ? (
              <TouchableOpacity
                onPress={() => setRestExpanded(true)}
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
            <CalmPrimaryButton
              label={t('hoy.inicio.tasksFirstCta')}
              onPress={() => router.push('/(tabs)/vaciar')}
              variant="soft"
            />
          </View>
        )}
      </CalmCard>

      {todayMood && energyLevel > 0 ? (
        <HoySupportPanel
          userId={userId}
          emotionKey={todayMood}
          emotionLabel={emotionLabel}
          energyLevel={energyLevel}
        />
      ) : null}

      {hasRestContent ? (
        <View style={styles.restWrap}>
          <TouchableOpacity
            onPress={() => setRestExpanded(!restExpanded)}
            activeOpacity={0.85}
            style={styles.restToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: restExpanded }}
            accessibilityLabel={restExpanded ? t('hoy.restOfTodayHide') : t('hoy.restOfTodayToggle')}
          >
            <Text style={styles.restToggleText}>
              {restExpanded ? t('hoy.restOfTodayHide') : t('hoy.restOfTodayToggle')}
            </Text>
            {restExpanded ? (
              <ChevronUp size={18} color={THEME.colors.calm.lavenderDeep} />
            ) : (
              <ChevronDown size={18} color={THEME.colors.calm.lavenderDeep} />
            )}
          </TouchableOpacity>

          {restExpanded ? (
            <View style={styles.restPanel}>
              {showDayFlowCard ? (
                <HoyDayFlowSection
                  showDayChangedCard={showDayChangedCard}
                  showNothingDoneCard={showNothingDoneCard}
                  onDismissDayChanged={onDismissDayChanged!}
                  onQuickRecheck={onQuickRecheck}
                  onLightenLoad={onLightenLoad}
                />
              ) : null}

              {hiddenInSection > 0 ? (
                <View style={styles.extraStepsBlock}>
                  {incompleteFocusTasks.slice(maxVisibleSteps).map((task, index) => (
                    <HoyFocusTaskRow
                      key={task.id}
                      task={task}
                      index={index + maxVisibleSteps}
                      projectName={
                        task.project_id ? projectsMap[task.project_id]?.name ?? null : null
                      }
                      onToggleComplete={() => onToggleTask(task.id)}
                      onOpenDetails={() => onOpenTask(task)}
                      onDelete={onDeleteTask ? () => onDeleteTask(task) : undefined}
                    />
                  ))}
                </View>
              ) : null}

              {showLightenInRest ? (
                <>
                  <CalmPrimaryButton
                    label={t('hoy.focusLightenCta')}
                    onPress={onLightenLoad!}
                    variant="soft"
                    accessibilityLabel={t('hoy.focusLightenCta')}
                    accessibilityHint={t('hoy.focusLightenA11y')}
                  />
                  <Text style={styles.restHint}>{t('hoy.focusLightenSub')}</Text>
                </>
              ) : null}

              {focusTasks.length > 0 && time && focusLevel ? (
                <KoraaLogicExplanation
                  checkIn={{
                    energyLevel,
                    emotion: todayMood,
                    availableTime: time,
                    focusLevel,
                  }}
                  emotionLabel={emotionLabel}
                />
              ) : null}

            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: THEME.spacing.md,
  },
  captureLink: {
    alignSelf: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  captureLinkText: {
    ...THEME.typography.caption,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textDecorationLine: 'underline',
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
  restWrap: {
    gap: THEME.spacing.xs,
  },
  restToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
  },
  restToggleText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  restPanel: {
    gap: THEME.spacing.sm,
    ...THEME.surfaces.panel,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
  },
  extraStepsBlock: {
    gap: THEME.spacing.md,
  },
  restLink: {
    alignSelf: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  restLinkText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
  },
  restHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
