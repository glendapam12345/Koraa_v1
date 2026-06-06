import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, CircleHelp, ChevronDown, ChevronUp, RefreshCw, Feather } from 'lucide-react-native';
import { router } from 'expo-router';
import { openRecheckCheckIn } from '@/lib/recheckCheckInBridge';
import { THEME } from '@/constants/theme';
import { FocusProgressBar } from '@/components/FocusProgressBar';
import type { FocusProgressStats } from '@/components/FocusProgressBar';
import { HoyFocusTaskRow } from '@/components/hoy/HoyFocusTaskRow';
import { HoyMoodHeroCard } from '@/components/hoy/HoyMoodHeroCard';
import { HoyDayFlowSection } from '@/components/hoy/HoyDayFlowSection';
import { HoyFocusScopeBanner } from '@/components/hoy/HoyFocusScopeBanner';
import { CalmCard } from '@/components/ui/calm/CalmCard';
import { CalmPrimaryButton } from '@/components/ui/calm/CalmPrimaryButton';
import { useHoyCoachMessage } from '@/hooks/useHoyCoachMessage';
import { getEmotionEmoji } from '@/lib/emotionEmoji';
import { getFirstName } from '@/lib/displayName';
import { useI18n } from '@/contexts/I18nContext';
import type { Task } from '@/components/tasks/TaskCard';
import type { AppLocale } from '@/lib/i18n';

type HoyFocusPanelProps = {
  userId?: string;
  locale: AppLocale;
  displayName: string;
  currentStreak: number;
  todayMood: string;
  emotionLabel: string;
  energyLevel: number;
  coachSuggestion: string;
  priorityStats: FocusProgressStats;
  focusTasks: Task[];
  totalPending: number;
  projectsMap: Record<string, { name: string; color?: string }>;
  onToggleTask: (taskId: string) => void;
  onOpenTask: (task: Task) => void;
  onOpenCalendar: () => void;
  onShowMoreForToday?: () => void;
  onDeleteTask?: (task: Task) => void;
  onChangeEmotion?: () => void;
  showDayChangedCard?: boolean;
  showNothingDoneCard?: boolean;
  onQuickRecheck?: () => void;
  onDismissDayChanged?: () => void;
  onLightenLoad?: () => void;
  /** Día 2+: panel «Más opciones» abierto al entrar. */
  initialMoreOpen?: boolean;
};

export function HoyFocusPanel({
  userId,
  locale,
  displayName,
  currentStreak,
  emotionLabel,
  energyLevel,
  todayMood,
  coachSuggestion,
  priorityStats,
  focusTasks,
  totalPending,
  projectsMap,
  onToggleTask,
  onOpenTask,
  onOpenCalendar,
  onShowMoreForToday,
  onDeleteTask,
  onChangeEmotion,
  showDayChangedCard = false,
  showNothingDoneCard = false,
  onQuickRecheck,
  onDismissDayChanged,
  onLightenLoad,
  initialMoreOpen = false,
}: HoyFocusPanelProps) {
  const { t } = useI18n();
  const [moreOpen, setMoreOpen] = useState(initialMoreOpen);

  useEffect(() => {
    if (initialMoreOpen) setMoreOpen(true);
  }, [initialMoreOpen]);

  const firstName = getFirstName(displayName);
  const emotionEmoji = getEmotionEmoji(todayMood);
  const nonFocusPending = Math.max(0, totalPending - focusTasks.length);
  const allFocusDone =
    priorityStats.total > 0 && priorityStats.done >= priorityStats.total;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('hoy.greetingMorning');
    if (hour < 18) return t('hoy.greetingAfternoon');
    return t('hoy.greetingEvening');
  }, [t]);

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
  const openFocusSession = () => router.push('/focus-session');

  const focusTaskNames = useMemo(
    () => focusTasks.filter((task) => !task.is_completed).map((task) => task.content.trim()).filter(Boolean),
    [focusTasks],
  );
  const firstFocusTaskName = focusTaskNames[0];
  const activeFocusCount = focusTasks.filter((task) => !task.is_completed).length;
  const totalFocusCount = focusTasks.length;

  const showDayFlowCard =
    (showDayChangedCard || showNothingDoneCard) &&
    Boolean(onQuickRecheck && onDismissDayChanged && onLightenLoad);

  const showActionRow = Boolean(onQuickRecheck || onLightenLoad) && totalFocusCount + nonFocusPending > 0;

  const coachLine = coach?.body ?? t('hoy.focusCoachFallback');
  const hasMoreOptions =
    !allFocusDone || nonFocusPending > 0 || Boolean(onShowMoreForToday) || currentStreak > 0;

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <Text style={styles.greeting}>
          {t('hoy.focusGreeting', { greeting, name: firstName })}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/help')}
          style={styles.helpBtn}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={t('hoyExtra.helpA11y')}
          accessibilityHint={t('hoyExtra.helpHint')}
        >
          <CircleHelp size={THEME.sizes.iconStandard} color={THEME.colors.text.main} />
        </TouchableOpacity>
      </View>

      <HoyMoodHeroCard
        emotionEmoji={emotionEmoji}
        emotionLabel={emotionLabel}
        energyLevel={energyLevel}
        focusCount={totalFocusCount}
        restCount={nonFocusPending}
        firstFocusTaskName={firstFocusTaskName}
        coachLine={coachLine}
        allFocusDone={allFocusDone}
        onPressFeel={openFeel}
      />

      {showDayFlowCard ? (
        <HoyDayFlowSection
          showDayChangedCard={showDayChangedCard}
          showNothingDoneCard={showNothingDoneCard}
          focusTaskNames={focusTaskNames}
          onDismissDayChanged={onDismissDayChanged!}
        />
      ) : null}

      {!allFocusDone && priorityStats.total > 0 ? (
        <FocusProgressBar stats={priorityStats} variant="prominent" taskNames={focusTaskNames} />
      ) : null}

      <View style={styles.focusHeader}>
        <Text style={styles.sectionTitle}>{t('hoy.focusTasksSection')}</Text>
        {focusTasks.length > 0 ? (
          <Text style={styles.sectionSub}>
            {t('hoy.focusPanelSubtitle', {
              count: activeFocusCount,
              emotion: emotionLabel.toLowerCase(),
            })}
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
              {focusTasks.map((task, index) => (
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
            <Text style={styles.listHint}>{t('hoy.focusListHint')}</Text>
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

      {showActionRow ? (
        <View style={styles.actionRow}>
          {onQuickRecheck ? (
            <TouchableOpacity
              style={styles.actionPrimary}
              onPress={onQuickRecheck}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('hoy.focusReorganizeCta')}
              accessibilityHint={t('hoy.focusReorganizeA11y')}
            >
              <RefreshCw size={18} color={THEME.colors.onGradient} />
              <Text style={styles.actionPrimaryText}>{t('hoy.focusReorganizeCta')}</Text>
            </TouchableOpacity>
          ) : null}
          {onLightenLoad && nonFocusPending > 0 ? (
            <TouchableOpacity
              style={styles.actionSecondary}
              onPress={onLightenLoad}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('hoy.focusLightenCta')}
              accessibilityHint={t('hoy.focusLightenA11y')}
            >
              <Feather size={18} color={THEME.colors.calm.lavenderDeep} />
              <Text style={styles.actionSecondaryText}>{t('hoy.focusLightenCta')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {nonFocusPending > 0 ? (
        <HoyFocusScopeBanner totalPending={totalPending} focusCount={totalFocusCount} />
      ) : null}

      {hasMoreOptions ? (
        <View style={styles.moreWrap}>
          <TouchableOpacity
            onPress={() => setMoreOpen((o) => !o)}
            activeOpacity={0.85}
            style={styles.moreToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: moreOpen }}
            accessibilityLabel={moreOpen ? t('hoy.focusMoreOptionsHide') : t('hoy.focusMoreOptions')}
          >
            <Text style={styles.moreToggleText}>
              {moreOpen ? t('hoy.focusMoreOptionsHide') : t('hoy.focusMoreOptions')}
            </Text>
            {moreOpen ? (
              <ChevronUp size={18} color={THEME.colors.calm.lavenderDeep} />
            ) : (
              <ChevronDown size={18} color={THEME.colors.calm.lavenderDeep} />
            )}
          </TouchableOpacity>

          {moreOpen ? (
            <View style={styles.morePanel}>
              {!allFocusDone ? (
                <CalmPrimaryButton
                  label={t('hoy.focusStartSession')}
                  onPress={openFocusSession}
                  variant="soft"
                />
              ) : null}

              <TouchableOpacity
                onPress={onOpenCalendar}
                activeOpacity={0.75}
                accessibilityRole="link"
                accessibilityLabel={t('hoy.focusLinkCalendar')}
                style={styles.moreLink}
              >
                <Text style={styles.moreLinkText}>{t('hoy.focusLinkCalendar')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/tips')}
                activeOpacity={0.75}
                accessibilityRole="link"
                accessibilityLabel={t('hoy.focusLinkTips')}
                style={styles.moreLink}
              >
                <Text style={styles.moreLinkText}>{t('hoy.focusLinkTips')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/settings')}
                activeOpacity={0.75}
                accessibilityRole="link"
                accessibilityLabel={t('hoy.focusLinkReminders')}
                style={styles.moreLink}
              >
                <Text style={styles.moreLinkText}>{t('hoy.focusLinkReminders')}</Text>
              </TouchableOpacity>

              <Text style={styles.moreHint}>{t('hoy.focusDeviceCalendarHint')}</Text>

              {onShowMoreForToday ? (
                <TouchableOpacity
                  onPress={onShowMoreForToday}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={t('hoy.showMoreForToday')}
                  style={styles.moreLink}
                >
                  <Text style={styles.moreLinkText}>{t('hoy.showMoreForTodayLink')}</Text>
                </TouchableOpacity>
              ) : null}

              {nonFocusPending > 0 ? (
                <Text style={styles.moreHint}>
                  {t('hoy.focusMoreInCalendar', { count: nonFocusPending })}
                </Text>
              ) : null}

              {currentStreak > 0 ? (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/parami')}
                  activeOpacity={0.75}
                  accessibilityRole="link"
                  accessibilityLabel={t('hoy.focusStreakTiny', { count: currentStreak })}
                  style={styles.moreLink}
                >
                  <Text style={styles.moreLinkText}>
                    {t('hoy.focusStreakTiny', { count: currentStreak })}
                  </Text>
                </TouchableOpacity>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  greeting: {
    ...THEME.typography.h1,
    fontSize: 32,
    lineHeight: 38,
    color: THEME.colors.text.main,
    flex: 1,
  },
  helpBtn: {
    padding: THEME.spacing.xs,
    minWidth: THEME.sizes.touchTarget,
    minHeight: THEME.sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
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
  listHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.metaOnFill,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: THEME.spacing.xs,
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
  actionRow: {
    gap: THEME.spacing.sm,
  },
  actionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.calm.lavenderDeep,
    paddingHorizontal: THEME.spacing.md,
  },
  actionPrimaryText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.bold,
    color: THEME.colors.onGradient,
    textAlign: 'center',
    flexShrink: 1,
  },
  actionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    minHeight: THEME.sizes.touchTarget,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: THEME.colors.fill[100],
    borderWidth: 1,
    borderColor: THEME.colors.calm.lavender,
    paddingHorizontal: THEME.spacing.md,
  },
  actionSecondaryText: {
    ...THEME.typography.body,
    fontFamily: THEME.fonts.heading.medium,
    color: THEME.colors.calm.lavenderDeep,
    textAlign: 'center',
    flexShrink: 1,
  },
  moreWrap: {
    gap: THEME.spacing.xs,
  },
  moreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.sm,
    ...THEME.surfaces.panel,
    borderRadius: THEME.borderRadius.rounded,
  },
  moreToggleText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.bold,
  },
  morePanel: {
    gap: THEME.spacing.sm,
    ...THEME.surfaces.panel,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.rounded,
  },
  moreLink: {
    alignSelf: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  moreLinkText: {
    ...THEME.typography.body,
    color: THEME.colors.calm.lavenderDeep,
    fontFamily: THEME.fonts.heading.medium,
    textAlign: 'center',
  },
  moreHint: {
    ...THEME.typography.caption,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
